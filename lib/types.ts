export type AppItem = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  description_ko?: string;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  category: string;
  pushed_at: string;
  created_at: string;
  updated_at: string;
  owner_avatar: string;
  owner_login: string;
  license?: string | null;
  isNew?: boolean;
};

export type AppsData = {
  fetched_at: string;
  total: number;
  sections: {
    daily_new: AppItem[];
    top_starred: AppItem[];
    windows_focus: AppItem[];
    ai_focus?: AppItem[];
    desktop_focus?: AppItem[];
  };
  all: AppItem[];
};
