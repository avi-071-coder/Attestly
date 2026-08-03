/**
 * ATTESTLY — Centralized API Client
 * Manages JWT tokens, authenticated requests, public community endpoints & benchmark leaderboard.
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

  private async request(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };
    
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

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
    return res.json();
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
