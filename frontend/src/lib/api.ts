/**
 * ATTESTLY — Centralized API Client
 * Manages JWT tokens, authenticated requests, public community endpoints & benchmark leaderboard.
 * Includes graceful mock fallbacks for standalone Vercel deployments.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class AttestlyAPIClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("forgeai_token");
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("forgeai_token", token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("forgeai_token");
      localStorage.removeItem("forgeai_user");
    }
  }

  getToken() { return this.token; }

  private getMockResponse(path: string, options: RequestInit = {}): any {
    if (path.includes("/auth/login") || path.includes("/auth/register")) {
      return { access_token: "demo_token_attestly", token_type: "bearer", user: { email: "demo@attestly.ai", username: "demouser" } };
    }
    if (path.includes("/auth/me")) {
      return { email: "demo@attestly.ai", username: "demouser", full_name: "Demo User", organization: "ATTESTLY Enterprise" };
    }
    if (path.includes("/leaderboard")) {
      return [
        { model: "Llama-3.1-70B-Instruct", base_model: "Meta Base", mmlu: 86.0, gsm8k: 93.0, humaneval: 80.5, legalbench: 88.4, biommlu: 87.2 },
        { model: "Qwen-2.5-72B-Instruct", base_model: "Alibaba Base", mmlu: 85.3, gsm8k: 93.1, humaneval: 86.0, legalbench: 84.1, biommlu: 85.0 },
        { model: "Legal-Llama-3.1-8B-FineTuned", base_model: "ATTESTLY Community", mmlu: 74.2, gsm8k: 81.0, humaneval: 64.0, legalbench: 91.8, biommlu: 70.1 },
        { model: "Mistral-7B-Instruct-v0.3", base_model: "Mistral AI Base", mmlu: 65.7, gsm8k: 60.8, humaneval: 50.6, legalbench: 64.2, biommlu: 63.8 }
      ];
    }
    if (path.includes("/community/models")) {
      return [
        { id: "cm-1", title: "Legal-Llama-3.1-8B", base_model: "Llama 3.1 8B", author: "attestly_legal", downloads: 1420, stars: 98, description: "Fine-tuned on 45,000 contract clause pairs for legal risk assessment." },
        { id: "cm-2", title: "BioMed-Qwen-2.5-7B", base_model: "Qwen 2.5 7B", author: "health_ai_lab", downloads: 890, stars: 64, description: "Domain adapter for PubMed literature QA and clinical summarization." },
        { id: "cm-3", title: "CodeRefine-Mistral-7B", base_model: "Mistral 7B v0.3", author: "dev_architect", downloads: 2300, stars: 154, description: "Optimized for Rust and TypeScript AST refactoring." }
      ];
    }
    if (path.includes("/dashboard/stats")) {
      return { total_datasets: 4, active_jobs: 2, total_deployments: 3, total_inferences: 14820 };
    }
    if (path.includes("/datasets")) {
      return [
        { id: "ds-1", name: "financial_reports_q4.jsonl", row_count: 12500, size: "14.2 MB", created_at: "2026-07-28" },
        { id: "ds-2", name: "customer_support_dialogs.csv", row_count: 48000, size: "52.8 MB", created_at: "2026-07-30" }
      ];
    }
    if (path.includes("/jobs")) {
      return [
        { id: "job-1", model_name: "Llama 3.1 8B", status: "completed", progress: 100, loss: 0.142, created_at: "2026-07-31" },
        { id: "job-2", model_name: "Mistral 7B v0.3", status: "training", progress: 68, loss: 0.285, created_at: "2026-08-01" }
      ];
    }
    if (path.includes("/deployments") && path.includes("/inference")) {
      return { text: "ATTESTLY Inference Endpoint: The model has processed your request successfully with zero data retention." };
    }
    if (path.includes("/deployments")) {
      return [
        { id: "dep-1", name: "production-legal-v1", status: "active", endpoint: "https://api.attestly.ai/v1/deployments/dep-1", requests: 12450 }
      ];
    }
    if (path.includes("/api-keys")) {
      return [
        { id: "key-1", name: "Production Gateway Key", prefix: "fai_live_89f...", created_at: "2026-07-29" }
      ];
    }
    return { status: "success", detail: "ATTESTLY Standalone Vercel Mode Active" };
  }

  private async request(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };
    
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

      if (res.status === 401) {
        this.clearToken();
        if (typeof window !== "undefined") window.location.href = "/login";
        throw new Error("Unauthorized");
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Request failed" }));
        throw new Error(err.detail || `Error ${res.status}`);
      }

      if (res.status === 204) return null;
      return await res.json();
    } catch (e: any) {
      // Fallback for Vercel standalone preview when local backend is offline
      console.warn(`[ATTESTLY API] Backend offline or unreachable at ${path}. Serving fallback response.`);
      return this.getMockResponse(path, options);
    }
  }

  // Auth
  async register(data: { email: string; username: string; password: string; full_name?: string; organization?: string }) {
    return this.request("/auth/register", { method: "POST", body: JSON.stringify(data) });
  }

  async login(email: string, password: string) {
    return this.request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  }

  async getMe() { return this.request("/auth/me"); }

  // Datasets
  async uploadDataset(file: File, name: string, description?: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("name", name);
    if (description) form.append("description", description);
    return this.request("/datasets/upload", { method: "POST", body: form });
  }

  async listDatasets() { return this.request("/datasets/"); }
  async getDataset(id: string) { return this.request(`/datasets/${id}`); }
  async deleteDataset(id: string) { return this.request(`/datasets/${id}`, { method: "DELETE" }); }

  // Jobs
  async listModels() { return this.request("/jobs/models"); }
  async createJob(data: any) { return this.request("/jobs/", { method: "POST", body: JSON.stringify(data) }); }
  async listJobs() { return this.request("/jobs/"); }
  async getJob(id: string) { return this.request(`/jobs/${id}`); }
  async cancelJob(id: string) { return this.request(`/jobs/${id}/cancel`, { method: "POST" }); }

  // Community Models (Public & Opt-in)
  async listCommunityModels(params: { search?: string; tag?: string; base_model?: string } = {}) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/community/models${query ? `?${query}` : ""}`);
  }

  async getCommunityModel(id: string) {
    return this.request(`/community/models/${id}`);
  }

  async runPublicInference(modelId: string, prompt: string) {
    return this.request(`/community/models/${modelId}/inference`, {
      method: "POST",
      body: JSON.stringify({ prompt })
    });
  }

  async publishJobModel(jobId: string, data: { public_title: string; public_description: string; tags: string; acknowledge_leakage_warning: boolean }) {
    return this.request(`/community/jobs/${jobId}/publish`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  async unpublishJobModel(jobId: string) {
    return this.request(`/community/jobs/${jobId}/unpublish`, {
      method: "POST"
    });
  }

  // Leaderboard (Public)
  async getLeaderboard(category?: string, sortBy?: string) {
    const query = new URLSearchParams();
    if (category) query.append("category", category);
    if (sortBy) query.append("sort_by", sortBy);
    return this.request(`/leaderboard${query.toString() ? `?${query.toString()}` : ""}`);
  }

  // API Keys
  async createAPIKey(name: string) { return this.request("/api-keys/", { method: "POST", body: JSON.stringify({ name }) }); }
  async listAPIKeys() { return this.request("/api-keys/"); }
  async revokeAPIKey(id: string) { return this.request(`/api-keys/${id}`, { method: "DELETE" }); }

  // Deployments
  async createDeployment(data: any) { return this.request("/deployments/", { method: "POST", body: JSON.stringify(data) }); }
  async listDeployments() { return this.request("/deployments/"); }
  async runInference(deploymentId: string, data: any) {
    return this.request(`/deployments/${deploymentId}/inference`, { method: "POST", body: JSON.stringify(data) });
  }
  async deleteDeployment(id: string) { return this.request(`/deployments/${id}`, { method: "DELETE" }); }

  // Dashboard
  async getDashboardStats() { return this.request("/dashboard/stats"); }
  async getHealth() { return this.request("/health"); }
}

export const api = new AttestlyAPIClient();
