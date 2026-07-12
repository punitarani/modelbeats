CREATE TABLE `benchmark_results` (
	`id` integer PRIMARY KEY NOT NULL,
	`model_id` integer NOT NULL,
	`benchmark_id` integer NOT NULL,
	`score` real NOT NULL,
	`score_normalized` real,
	`evaluated_at` text,
	`source` text NOT NULL,
	`source_url` text,
	`settings` text,
	`is_verified` integer DEFAULT false NOT NULL,
	`notes` text,
	FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`benchmark_id`) REFERENCES `benchmarks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_results_benchmark_score` ON `benchmark_results` (`benchmark_id`,`score`);--> statement-breakpoint
CREATE INDEX `idx_results_model` ON `benchmark_results` (`model_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_result_model_benchmark_source` ON `benchmark_results` (`model_id`,`benchmark_id`,`source`);--> statement-breakpoint
CREATE TABLE `benchmarks` (
	`id` integer PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`unit` text NOT NULL,
	`description` text NOT NULL,
	`methodology_url` text,
	`norm_min` real NOT NULL,
	`norm_max` real NOT NULL,
	`higher_is_better` integer DEFAULT true NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `benchmarks_slug_unique` ON `benchmarks` (`slug`);--> statement-breakpoint
CREATE TABLE `hardware_profiles` (
	`id` integer PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`vram_gb` real NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hardware_profiles_slug_unique` ON `hardware_profiles` (`slug`);--> statement-breakpoint
CREATE TABLE `meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `model_families` (
	`id` integer PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`org_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `model_families_slug_unique` ON `model_families` (`slug`);--> statement-breakpoint
CREATE TABLE `model_pricing` (
	`id` integer PRIMARY KEY NOT NULL,
	`model_id` integer NOT NULL,
	`provider` text NOT NULL,
	`input_per_mtok` real NOT NULL,
	`output_per_mtok` real NOT NULL,
	`effective_date` text NOT NULL,
	FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_pricing` ON `model_pricing` (`model_id`,`provider`,`effective_date`);--> statement-breakpoint
CREATE TABLE `model_scores` (
	`model_id` integer PRIMARY KEY NOT NULL,
	`overall_index` real NOT NULL,
	`rank_overall` integer NOT NULL,
	`rank_delta_30d` integer,
	`human_preference_index` real,
	`knowledge_index` real,
	`reasoning_index` real,
	`coding_index` real,
	`math_index` real,
	`vision_index` real,
	`agents_index` real,
	`arena_elo` real,
	`computed_at` text NOT NULL,
	FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `models` (
	`id` integer PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`org_id` integer NOT NULL,
	`family_id` integer NOT NULL,
	`name` text NOT NULL,
	`release_date` text NOT NULL,
	`status` text DEFAULT 'released' NOT NULL,
	`predecessor_id` integer,
	`openness` text NOT NULL,
	`license` text NOT NULL,
	`license_url` text,
	`params_total_b` real,
	`params_active_b` real,
	`arch_class` text NOT NULL,
	`arch_display` text NOT NULL,
	`context_length` integer NOT NULL,
	`max_output_tokens` integer,
	`modalities` text NOT NULL,
	`lang_count` integer,
	`is_reasoning` integer DEFAULT false NOT NULL,
	`supports_function_calling` integer DEFAULT false NOT NULL,
	`supports_tool_use` integer DEFAULT false NOT NULL,
	`agent_optimized` integer DEFAULT false NOT NULL,
	`capabilities` text NOT NULL,
	`api_available` integer DEFAULT false NOT NULL,
	`links` text DEFAULT '{}' NOT NULL,
	`note` text NOT NULL,
	`quants` text DEFAULT '[]' NOT NULL,
	`vram_q4_gb` real,
	`vram_fp16_gb` real,
	`tps_note` text,
	`updated_at` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`family_id`) REFERENCES `model_families`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `models_slug_unique` ON `models` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_models_release_date` ON `models` (`release_date`);--> statement-breakpoint
CREATE INDEX `idx_models_org` ON `models` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_models_family` ON `models` (`family_id`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` integer PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'company' NOT NULL,
	`country` text,
	`url` text,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE TABLE `quantizations` (
	`id` integer PRIMARY KEY NOT NULL,
	`model_id` integer NOT NULL,
	`method` text NOT NULL,
	`bits` real,
	`disk_size_gb` real,
	`min_vram_gb` real,
	`min_ram_gb` real,
	`quality_note` text,
	`download_url` text,
	FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_quant_model_method` ON `quantizations` (`model_id`,`method`);--> statement-breakpoint
CREATE TABLE `throughput_estimates` (
	`id` integer PRIMARY KEY NOT NULL,
	`model_id` integer NOT NULL,
	`quantization_id` integer NOT NULL,
	`hardware_id` integer NOT NULL,
	`framework` text NOT NULL,
	`tokens_per_sec` real NOT NULL,
	`context_tested` integer,
	`source` text,
	`source_url` text,
	FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`quantization_id`) REFERENCES `quantizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`hardware_id`) REFERENCES `hardware_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_throughput_hardware` ON `throughput_estimates` (`hardware_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_throughput` ON `throughput_estimates` (`quantization_id`,`hardware_id`,`framework`);