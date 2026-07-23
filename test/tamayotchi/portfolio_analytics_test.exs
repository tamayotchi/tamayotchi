defmodule Tamayotchi.PortfolioAnalyticsTest do
  use ExUnit.Case, async: true

  alias Tamayotchi.PortfolioAnalytics

  describe "year_end_snapshots/1" do
    test "calculates cumulative and year-only gain metrics from year-end values" do
      entries =
        [
          %{"date" => "2023-01-01", "amount" => 1_000},
          %{"date" => "2023-12-31", "amount" => 1_100, "isYearEndValue" => true},
          %{"date" => "2024-06-01", "amount" => 900},
          %{"date" => "2024-12-31", "amount" => 2_300, "isYearEndValue" => true}
        ]
        |> PortfolioAnalytics.normalize_entries("TEST")

      [snapshot_2023, snapshot_2024] = PortfolioAnalytics.year_end_snapshots(entries)

      assert snapshot_2023.year == 2023
      assert snapshot_2023.end_value == 1_100.0
      assert snapshot_2023.contributed_to_date == 1_000.0
      assert snapshot_2023.increase_amount == 100.0
      assert_in_delta snapshot_2023.increase_percentage, 9.09, 0.01
      assert snapshot_2023.year_increase_amount == 100.0
      assert snapshot_2023.year_increase_percentage == 10.0

      assert snapshot_2024.year == 2024
      assert snapshot_2024.end_value == 2_300.0
      assert snapshot_2024.contributed_to_date == 1_900.0
      assert snapshot_2024.increase_amount == 400.0
      assert_in_delta snapshot_2024.increase_percentage, 17.39, 0.01
      assert snapshot_2024.year_increase_amount == 300.0
      assert snapshot_2024.year_increase_percentage == 15.0
    end
  end

  describe "current_tracked_value/1" do
    test "uses latest year-end value plus later contributions per provider" do
      entries =
        [
          %{"date" => "2023-01-01", "amount" => 1_000},
          %{"date" => "2023-12-31", "amount" => 1_100, "isYearEndValue" => true},
          %{"date" => "2024-01-10", "amount" => 200}
        ]
        |> PortfolioAnalytics.normalize_entries("TEST")

      assert PortfolioAnalytics.current_tracked_value(entries) == 1_300.0
    end
  end
end
