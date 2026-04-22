CREATE TABLE IF NOT EXISTS new_product_development.opportunity_briefs (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  opportunity_source TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  target_market TEXT NOT NULL,
  target_customer TEXT NOT NULL,
  unique_selling_points TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  compliance_notes TEXT NULL,
  required_documents_complete BOOLEAN NOT NULL DEFAULT FALSE,
  affordable_price_score SMALLINT NOT NULL,
  affordable_cost_score SMALLINT NOT NULL,
  affordable_value_score SMALLINT NOT NULL,
  reliable_durability_score SMALLINT NOT NULL,
  reliable_service_score SMALLINT NOT NULL,
  reliable_compliance_score SMALLINT NOT NULL,
  trendy_design_score SMALLINT NOT NULL,
  trendy_colour_score SMALLINT NOT NULL,
  trendy_category_score SMALLINT NOT NULL,
  art_total_score SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT opportunity_briefs_art_total_score_range CHECK (art_total_score BETWEEN 0 AND 18),
  CONSTRAINT opportunity_briefs_affordable_price_score_range CHECK (affordable_price_score BETWEEN 0 AND 2),
  CONSTRAINT opportunity_briefs_affordable_cost_score_range CHECK (affordable_cost_score BETWEEN 0 AND 2),
  CONSTRAINT opportunity_briefs_affordable_value_score_range CHECK (affordable_value_score BETWEEN 0 AND 2),
  CONSTRAINT opportunity_briefs_reliable_durability_score_range CHECK (reliable_durability_score BETWEEN 0 AND 2),
  CONSTRAINT opportunity_briefs_reliable_service_score_range CHECK (reliable_service_score BETWEEN 0 AND 2),
  CONSTRAINT opportunity_briefs_reliable_compliance_score_range CHECK (reliable_compliance_score BETWEEN 0 AND 2),
  CONSTRAINT opportunity_briefs_trendy_design_score_range CHECK (trendy_design_score BETWEEN 0 AND 2),
  CONSTRAINT opportunity_briefs_trendy_colour_score_range CHECK (trendy_colour_score BETWEEN 0 AND 2),
  CONSTRAINT opportunity_briefs_trendy_category_score_range CHECK (trendy_category_score BETWEEN 0 AND 2)
);

CREATE TABLE IF NOT EXISTS new_product_development.market_sizing_records (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  annual_market_size_units INTEGER NOT NULL,
  annual_market_size_value NUMERIC(14, 2) NOT NULL,
  target_segment TEXT NOT NULL,
  target_price_band TEXT NOT NULL,
  year_one_sales_units INTEGER NOT NULL,
  year_two_sales_units INTEGER NOT NULL,
  year_three_sales_units INTEGER NOT NULL,
  data_sources TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  assumptions TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT market_sizing_annual_market_size_units_non_negative CHECK (annual_market_size_units >= 0),
  CONSTRAINT market_sizing_annual_market_size_value_non_negative CHECK (annual_market_size_value >= 0),
  CONSTRAINT market_sizing_year_one_sales_units_non_negative CHECK (year_one_sales_units >= 0),
  CONSTRAINT market_sizing_year_two_sales_units_non_negative CHECK (year_two_sales_units >= 0),
  CONSTRAINT market_sizing_year_three_sales_units_non_negative CHECK (year_three_sales_units >= 0)
);

CREATE TABLE IF NOT EXISTS new_product_development.competitor_matrices (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE REFERENCES new_product_development.products (id) ON DELETE CASCADE,
  summary TEXT NULL,
  scoring_methodology TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS new_product_development.competitor_matrix_entries (
  id UUID PRIMARY KEY,
  matrix_id UUID NOT NULL REFERENCES new_product_development.competitor_matrices (id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  competitor_name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  model_name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  strengths TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  weaknesses TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  feature_score SMALLINT NOT NULL,
  value_score SMALLINT NOT NULL,
  design_score SMALLINT NOT NULL,
  overall_score SMALLINT NOT NULL,
  CONSTRAINT competitor_matrix_entries_price_non_negative CHECK (price >= 0),
  CONSTRAINT competitor_matrix_entries_feature_score_range CHECK (feature_score BETWEEN 0 AND 5),
  CONSTRAINT competitor_matrix_entries_value_score_range CHECK (value_score BETWEEN 0 AND 5),
  CONSTRAINT competitor_matrix_entries_design_score_range CHECK (design_score BETWEEN 0 AND 5),
  CONSTRAINT competitor_matrix_entries_overall_score_range CHECK (overall_score BETWEEN 0 AND 5)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_competitor_matrix_entries_unique_order
  ON new_product_development.competitor_matrix_entries (matrix_id, display_order);

CREATE INDEX IF NOT EXISTS idx_opportunity_briefs_product_id
  ON new_product_development.opportunity_briefs (product_id);

CREATE INDEX IF NOT EXISTS idx_market_sizing_records_product_id
  ON new_product_development.market_sizing_records (product_id);

CREATE INDEX IF NOT EXISTS idx_competitor_matrices_product_id
  ON new_product_development.competitor_matrices (product_id);

CREATE INDEX IF NOT EXISTS idx_competitor_matrix_entries_matrix_id
  ON new_product_development.competitor_matrix_entries (matrix_id, display_order);
