defmodule TamayotchiWeb.ExperimentController do
  use TamayotchiWeb, :controller

  alias Tamayotchi.PortfolioAnalytics
  alias Tamayotchi.PortfolioData

  @currencies ["USD", "COP"]
  @chart_width 960
  @chart_height 360
  @chart_left 74
  @chart_right 26
  @chart_top 24
  @chart_bottom 52

  def index(conn, params) do
    currency_code = selected_currency(params)
    entries = currency_entries(currency_code)
    today = Date.utc_today()
    start_year = today.year
    default_target_year = start_year + 4
    starting_balance = PortfolioAnalytics.current_tracked_value(entries)
    historical_rows = PortfolioAnalytics.year_end_snapshots(entries)
    historical_average_rate = average_rate(historical_rows)
    expected_rate = parsed_rate(params["expected_rate"], historical_average_rate)
    target_year = parsed_target_year(params["target_year"], start_year, default_target_year)

    default_investment =
      parsed_non_negative_float(params["default_investment"], default_investment())

    projection_rows =
      projection_rows(
        starting_balance,
        start_year,
        target_year,
        expected_rate,
        default_investment,
        params["investments"] || %{}
      )

    render(conn, :index,
      currency_code: currency_code,
      currencies: @currencies,
      starting_balance: starting_balance,
      historical_average_rate: historical_average_rate,
      expected_rate: expected_rate,
      target_year: target_year,
      start_year: start_year,
      default_investment: default_investment,
      projection_rows: projection_rows,
      chart: chart_payload(starting_balance, start_year, projection_rows),
      summary: projection_summary(starting_balance, projection_rows),
      form_values: form_values(currency_code, expected_rate, target_year, default_investment)
    )
  end

  defp selected_currency(%{"currency" => currency}) when currency in @currencies, do: currency
  defp selected_currency(_params), do: "USD"

  defp currency_entries(currency_code) do
    with {:ok, data} <- PortfolioData.load() do
      data
      |> PortfolioAnalytics.entries_for_currency(currency_code)
    else
      _ -> []
    end
  end

  defp average_rate(rows) do
    rates =
      rows
      |> Enum.map(& &1.year_increase_percentage)
      |> Enum.filter(&is_number/1)

    case rates do
      [] -> 10.0
      values -> Enum.sum(values) / length(values)
    end
  end

  defp projection_rows(
         starting_balance,
         start_year,
         target_year,
         expected_rate,
         default_investment,
         investments
       ) do
    start_year..target_year
    |> Enum.map_reduce(starting_balance, fn year, balance ->
      planned_investment =
        investments
        |> Map.get(Integer.to_string(year))
        |> parsed_non_negative_float(default_investment)

      base = balance + planned_investment
      projected_gain = base * expected_rate / 100
      end_balance = base + projected_gain

      row = %{
        year: year,
        start_balance: balance,
        planned_investment: planned_investment,
        base: base,
        expected_rate: expected_rate,
        projected_gain: projected_gain,
        end_balance: end_balance
      }

      {row, end_balance}
    end)
    |> elem(0)
  end

  defp projection_summary(starting_balance, rows) do
    total_planned = Enum.reduce(rows, 0.0, fn row, acc -> acc + row.planned_investment end)
    total_gain = Enum.reduce(rows, 0.0, fn row, acc -> acc + row.projected_gain end)

    projected_balance =
      rows |> List.last() |> then(&if(&1, do: &1.end_balance, else: starting_balance))

    %{
      total_planned: total_planned,
      total_gain: total_gain,
      projected_balance: projected_balance
    }
  end

  defp chart_payload(starting_balance, start_year, rows) do
    width = @chart_width
    height = @chart_height
    left = @chart_left
    right = @chart_right
    top = @chart_top
    bottom = @chart_bottom
    plot_width = width - left - right
    plot_height = height - top - bottom

    line_values = [starting_balance | Enum.map(rows, & &1.end_balance)]
    bar_values = Enum.map(rows, & &1.planned_investment)
    max_value = Enum.max(line_values ++ bar_values ++ [1.0])
    value_floor = 0.0
    value_ceil = max(max_value * 1.1, 1.0)

    point_count = length(rows) + 1
    step_x = if point_count <= 1, do: 0.0, else: plot_width / (point_count - 1)

    line_points =
      line_values
      |> Enum.with_index()
      |> Enum.map(fn {value, index} ->
        year = if index == 0, do: start_year - 1, else: start_year + index - 1

        %{
          year: year,
          value: value,
          x: left + step_x * index,
          y: project_y(value, value_floor, value_ceil, top, plot_height)
        }
      end)

    bar_width = if length(rows) <= 1, do: 34.0, else: min(42.0, step_x * 0.34)
    baseline = top + plot_height

    bars =
      rows
      |> Enum.with_index(1)
      |> Enum.map(fn {row, index} ->
        x = left + step_x * index
        y = project_y(row.planned_investment, value_floor, value_ceil, top, plot_height)

        %{
          year: row.year,
          value: row.planned_investment,
          x: x - bar_width / 2,
          y: y,
          width: bar_width,
          height: max(baseline - y, 1.0)
        }
      end)

    y_ticks =
      0..4
      |> Enum.map(fn tick ->
        ratio = tick / 4
        value = value_floor + (value_ceil - value_floor) * (1 - ratio)
        y = top + plot_height * ratio
        %{y: y, value: value}
      end)

    x_labels =
      line_points
      |> sampled_points(6)
      |> Enum.map(fn point ->
        label = if point.year == start_year - 1, do: "Start", else: Integer.to_string(point.year)
        %{x: point.x, label: label}
      end)

    line_path =
      line_points
      |> Enum.map(&svg_point(&1.x, &1.y))
      |> svg_line_path()

    area_path = area_path(line_points, baseline)

    %{
      width: width,
      height: height,
      line_path: line_path,
      area_path: area_path,
      y_ticks: y_ticks,
      x_labels: x_labels,
      line_points: line_points,
      bars: bars
    }
  end

  defp form_values(currency_code, expected_rate, target_year, default_investment) do
    %{
      "currency" => currency_code,
      "expected_rate" => format_input_number(expected_rate, 2),
      "target_year" => Integer.to_string(target_year),
      "default_investment" => format_input_number(default_investment, 0)
    }
  end

  defp parsed_target_year(value, start_year, default_year) do
    value
    |> parsed_integer(default_year)
    |> max(start_year)
    |> min(start_year + 50)
  end

  defp parsed_integer(value, default) when is_binary(value) do
    case Integer.parse(String.replace(value, ",", "")) do
      {number, ""} -> number
      _ -> default
    end
  end

  defp parsed_integer(_value, default), do: default

  defp parsed_rate(value, default) do
    value
    |> parsed_float(default)
    |> max(-99.0)
    |> min(500.0)
  end

  defp parsed_non_negative_float(value, default) do
    value
    |> parsed_float(default)
    |> max(0.0)
  end

  defp parsed_float(value, default) when is_binary(value) do
    normalized = value |> String.trim() |> String.replace(",", "")

    case Float.parse(normalized) do
      {number, ""} -> number
      _ -> default
    end
  end

  defp parsed_float(value, _default) when is_integer(value), do: value * 1.0
  defp parsed_float(value, _default) when is_float(value), do: value
  defp parsed_float(_value, default), do: default

  defp default_investment, do: 10_000.0

  defp project_y(value, floor, ceil, top, plot_height) do
    ratio = if ceil == floor, do: 0.5, else: (value - floor) / (ceil - floor)
    top + plot_height * (1 - ratio)
  end

  defp sampled_points([], _count), do: []

  defp sampled_points(points, count) do
    max_index = length(points) - 1

    if max_index <= 0 do
      points
    else
      0..(count - 1)
      |> Enum.map(fn i -> round(i * max_index / (count - 1)) end)
      |> Enum.uniq()
      |> Enum.map(fn index -> Enum.at(points, index) end)
    end
  end

  defp area_path([], _baseline), do: ""

  defp area_path([first | _] = points, baseline) do
    line_part = points |> Enum.map(&svg_point(&1.x, &1.y)) |> Enum.join(" L ")
    last = List.last(points)

    "M #{svg_float(first.x)} #{svg_float(baseline)} L " <>
      line_part <> " L #{svg_float(last.x)} #{svg_float(baseline)} Z"
  end

  defp svg_line_path([]), do: ""

  defp svg_line_path([head | tail]) do
    "M #{head}" <> Enum.map_join(tail, "", &" L #{&1}")
  end

  defp svg_point(x, y), do: "#{svg_float(x)} #{svg_float(y)}"

  defp svg_float(value) when is_float(value), do: :erlang.float_to_binary(value, decimals: 2)
  defp svg_float(value) when is_integer(value), do: Integer.to_string(value)

  defp format_input_number(value, 0) when is_number(value) do
    :erlang.float_to_binary(value, decimals: 0)
  end

  defp format_input_number(value, decimals) when is_number(value) do
    value
    |> :erlang.float_to_binary(decimals: decimals)
    |> String.trim_trailing("0")
    |> String.trim_trailing(".")
  end
end
