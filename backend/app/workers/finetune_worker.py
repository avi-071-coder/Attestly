"""
ForgeAI — Fine-Tuning Worker
Celery task that runs LoRA/QLoRA fine-tuning using HuggingFace PEFT.
This worker handles: model download, dataset prep, training, and model saving.
Each job runs in complete tenant isolation — separate data paths, no shared state.
"""
# NOTE: This is the production worker. For local testing without Celery/Redis,
# the training can be triggered directly via the service layer.

import os
import json
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Lazy imports — these are heavy ML libraries
def _import_ml_libs():
    import torch
    from transformers import (
        AutoTokenizer, AutoModelForCausalLM, TrainingArguments,
        BitsAndBytesConfig, DataCollatorForSeq2Seq
    )
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training, TaskType
    from datasets import load_dataset
    from trl import SFTTrainer, SFTConfig
    return torch, AutoTokenizer, AutoModelForCausalLM, TrainingArguments, BitsAndBytesConfig, \
           DataCollatorForSeq2Seq, LoraConfig, get_peft_model, prepare_model_for_kbit_training, \
           TaskType, load_dataset, SFTTrainer, SFTConfig


class FineTuneRunner:
    """
    Runs a single fine-tuning job with full tenant isolation.
    Supports any open-weight causal LM from HuggingFace Hub.
    """
    
    def __init__(self, job_config: dict):
        self.config = job_config
        self.base_model = job_config["base_model"]
        self.dataset_path = job_config["dataset_path"]
        self.output_dir = job_config["output_dir"]
        self.lora_r = job_config.get("lora_r", 16)
        self.lora_alpha = job_config.get("lora_alpha", 32)
        self.lora_dropout = job_config.get("lora_dropout", 0.05)
        self.learning_rate = job_config.get("learning_rate", 2e-4)
        self.num_epochs = job_config.get("num_epochs", 3)
        self.batch_size = job_config.get("batch_size", 4)
        self.max_seq_length = job_config.get("max_seq_length", 512)
        self.gradient_accumulation = job_config.get("gradient_accumulation_steps", 4)
        self.use_4bit = job_config.get("use_4bit", True)
        self.hf_token = job_config.get("hf_token", None)
    
    def run(self, progress_callback=None):
        """
        Execute the fine-tuning pipeline:
        1. Load & quantize base model
        2. Prepare dataset
        3. Configure LoRA adapters
        4. Train with SFTTrainer
        5. Save merged model or LoRA adapter
        """
        (torch, AutoTokenizer, AutoModelForCausalLM, TrainingArguments,
         BitsAndBytesConfig, DataCollatorForSeq2Seq, LoraConfig, get_peft_model,
         prepare_model_for_kbit_training, TaskType, load_dataset, SFTTrainer, SFTConfig) = _import_ml_libs()
        
        os.makedirs(self.output_dir, exist_ok=True)
        
        if progress_callback:
            progress_callback("downloading_model", 0)
        
        # Step 1: Quantization config
        bnb_config = None
        if self.use_4bit:
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.bfloat16,
                bnb_4bit_use_double_quant=True,
            )
        
        # Step 2: Load tokenizer & model
        tokenizer = AutoTokenizer.from_pretrained(
            self.base_model, token=self.hf_token, trust_remote_code=True)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        model = AutoModelForCausalLM.from_pretrained(
            self.base_model, quantization_config=bnb_config,
            device_map="auto", token=self.hf_token, trust_remote_code=True)
        
        if self.use_4bit:
            model = prepare_model_for_kbit_training(model)
        
        if progress_callback:
            progress_callback("preparing_data", 10)
        
        # Step 3: Load dataset
        ext = self.dataset_path.rsplit(".", 1)[-1].lower()
        if ext == "jsonl":
            dataset = load_dataset("json", data_files=self.dataset_path, split="train")
        elif ext == "csv":
            dataset = load_dataset("csv", data_files=self.dataset_path, split="train")
        else:
            dataset = load_dataset("json", data_files=self.dataset_path, split="train")
        
        # Step 4: LoRA config — targets all linear layers for maximum flexibility
        lora_config = LoraConfig(
            r=self.lora_r,
            lora_alpha=self.lora_alpha,
            lora_dropout=self.lora_dropout,
            bias="none",
            task_type=TaskType.CAUSAL_LM,
            target_modules="all-linear",  # Works for any architecture
        )
        
        model = get_peft_model(model, lora_config)
        trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
        total = sum(p.numel() for p in model.parameters())
        logger.info(f"Trainable params: {trainable:,} / {total:,} ({100*trainable/total:.2f}%)")
        
        if progress_callback:
            progress_callback("training", 20)
        
        # Step 5: Training config
        training_args = SFTConfig(
            output_dir=self.output_dir,
            num_train_epochs=self.num_epochs,
            per_device_train_batch_size=self.batch_size,
            gradient_accumulation_steps=self.gradient_accumulation,
            learning_rate=self.learning_rate,
            weight_decay=0.01,
            warmup_ratio=0.03,
            lr_scheduler_type="cosine",
            logging_steps=10,
            save_strategy="epoch",
            bf16=torch.cuda.is_bf16_supported() if torch.cuda.is_available() else False,
            fp16=not (torch.cuda.is_bf16_supported() if torch.cuda.is_available() else False) and torch.cuda.is_available(),
            max_seq_length=self.max_seq_length,
            dataset_text_field="text",
            report_to="none",  # Disable W&B etc. — use our own tracking
        )
        
        # Step 6: Train
        trainer = SFTTrainer(model=model, args=training_args,
            train_dataset=dataset, processing_class=tokenizer)
        
        train_result = trainer.train()
        
        if progress_callback:
            progress_callback("saving_model", 90)
        
        # Step 7: Save LoRA adapter
        adapter_dir = os.path.join(self.output_dir, "lora_adapter")
        model.save_pretrained(adapter_dir)
        tokenizer.save_pretrained(adapter_dir)
        
        # Save training metrics
        metrics = {
            "train_loss": train_result.training_loss,
            "train_runtime": train_result.metrics.get("train_runtime", 0),
            "train_samples_per_second": train_result.metrics.get("train_samples_per_second", 0),
            "base_model": self.base_model,
            "lora_r": self.lora_r,
            "lora_alpha": self.lora_alpha,
            "num_epochs": self.num_epochs,
            "trainable_params": trainable,
            "total_params": total,
        }
        with open(os.path.join(self.output_dir, "training_metrics.json"), "w") as f:
            json.dump(metrics, f, indent=2)
        
        if progress_callback:
            progress_callback("completed", 100)
        
        return {"adapter_path": adapter_dir, "metrics": metrics}


# ─── Celery Task (for production async execution) ─────────────────

try:
    from celery import Celery
    celery_app = Celery("forgeai")
    celery_app.config_from_object({
        "broker_url": os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0"),
        "result_backend": os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/1"),
    })
    
    @celery_app.task(bind=True, name="finetune.run")
    def run_finetune_task(self, job_config: dict):
        """Celery task wrapper for fine-tuning."""
        def progress_cb(status, percent):
            self.update_state(state="PROGRESS", meta={"status": status, "percent": percent})
        
        runner = FineTuneRunner(job_config)
        return runner.run(progress_callback=progress_cb)

except ImportError:
    logger.warning("Celery not available — fine-tuning will run synchronously")
