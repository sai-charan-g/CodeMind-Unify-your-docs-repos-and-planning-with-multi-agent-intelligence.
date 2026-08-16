// ---- Auth ----
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  github_username: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// ---- Projects ----
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  github_repo_url: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Chat ----
export interface Conversation {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  agent_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata_: Record<string, unknown> | null;
  token_count: number | null;
  created_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

// ---- Knowledge ----
export interface KnowledgeDocument {
  id: string;
  user_id: string;
  project_id: string | null;
  filename: string;
  content_type: string;
  status: "pending" | "processing" | "ready" | "error";
  chunk_count: number;
  error_message: string | null;
  created_at: string;
}

// ---- SSE Events ----
export interface SSETokenEvent {
  content: string;
}

export interface SSEMetadataEvent {
  intent: string;
  agent: string;
}
