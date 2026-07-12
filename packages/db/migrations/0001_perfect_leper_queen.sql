ALTER TABLE `models` ADD `effort_label` text;--> statement-breakpoint
ALTER TABLE `models` ADD `is_default_config` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `models` ADD `is_best_config` integer DEFAULT true NOT NULL;