export type JobType = "teacher" | "engineer" | "doctor";

export type Database = {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string;
          company: string;
          title: string;
          location: string;
          job_type: JobType;
          employment_type: "Full time" | "Part time" | "Contract";
          description: string;
          is_active: boolean;
          is_sample: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          company: string;
          title: string;
          location: string;
          job_type: JobType;
          employment_type: "Full time" | "Part time" | "Contract";
          description: string;
          is_active?: boolean;
          is_sample?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["jobs"]["Insert"]>;
        Relationships: [];
      };
      cvs: {
        Row: {
          id: string;
          user_id: string;
          owner_email: string;
          job_type: JobType;
          file_name: string;
          file_size_bytes: number;
          file_key: string;
          snapshot_key: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          owner_email: string;
          job_type: JobType;
          file_name: string;
          file_size_bytes: number;
          file_key: string;
          snapshot_key: string;
          uploaded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cvs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};