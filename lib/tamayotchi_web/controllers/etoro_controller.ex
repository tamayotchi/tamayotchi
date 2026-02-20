defmodule TamayotchiWeb.EtoroController do
  use TamayotchiWeb, :controller

  @portfolio_data_path Path.expand("../../../tamayotchi/src/data/data.json", __DIR__)
  @time_ranges ["1M", "3M", "6M", "YTD", "12M", "ALL"]

  def index(conn, params), do: render_platform(conn, params, "ETORO")

  defp render_platform(conn, params, platform_name) do
    {currency_code, entries} = platform_entries(platform_name)
    contribution_entries = Enum.reject(entries, & &1.year_end?)
    year_end_entries = Enum.filter(entries, & &1.year_end?)
    {selected_time_range, selected_year} = selected_filters(params)
    years = available_years(contribution_entries)

    filtered_contributions =
      filter_by_period(contribution_entries, selected_time_range, selected_year)

    filtered_year_end = filter_by_period(year_end_entries, selected_time_range, selected_year)

    points = build_points(filtered_contributions)

    render(conn, :index,
      platform_name: platform_name,
      currency_code: currency_code,
      chart: chart_payload(points, filtered_year_end),
      stats: stats(points, entries),
      selected_time_range: selected_time_range,
      selected_year: selected_year,
      time_ranges: @time_ranges,
      year_options: year_options(years)
    )
  end

  defp platform_entries(platform_name) do
    with {:ok, json} <- File.read(@portfolio_data_path),
         {:ok, data} <- Jason.decode(json),
         %{"content" => content} = platform_data <- Map.get(data, platform_name) do
      currency_code = Map.get(platform_data, "currencyCode", "USD")
      entries = normalize_entries(content)
      {currency_code, entries}
    else
      _ -> {"USD", []}
    end
  end

  defp normalize_entries(content) do
    content
    |> Enum.map(fn entry ->
      %{
        date: Map.get(entry, "date"),
        amount: numeric_amount(Map.get(entry, "amount")),
        year_end?: Map.get(entry, "isYearEndValue", false),
        date_obj: parse_date(Map.get(entry, "date"))
      }
    end)
    |> Enum.filter(&is_struct(&1.date_obj, Date))
    |> Enum.sort_by(& &1.date_obj)
  end

  defp build_points(entries) do
    points =
      entries
      |> Enum.map_reduce(0.0, fn entry, running_total ->
        portfolio_value = running_total + entry.amount
        {Map.put(entry, :portfolio_value, portfolio_value), portfolio_value}
      end)
      |> elem(0)

    case points do
      [] ->
        []

      [first | _] ->
        [
          first
          |> Map.put(:amount, 0.0)
          |> Map.put(:portfolio_value, 0.0)
          |> Map.put(:synthetic_start?, true)
          | points
        ]
    end
  end

  defp chart_payload([], _year_end_entries) do
    %{
      width: 960,
      height: 360,
      line_path: "",
      compound_line_path: "",
      area_path: "",
      y_ticks: [],
      x_labels: [],
      points: [],
      compound_points: []
    }
  end

  defp chart_payload(points, year_end_entries) do
    width = 960
    height = 360
    left = 54
    right = 24
    top = 20
    bottom = 40
    plot_width = width - left - right
    plot_height = height - top - bottom

    values = Enum.map(points, & &1.portfolio_value) ++ Enum.map(year_end_entries, & &1.amount)
    max_value = Enum.max(values)
    value_floor = 0.0
    value_ceil = max(max_value * 1.08, 1.0)

    step_x =
      case length(points) do
        count when count <= 1 -> 0.0
        count -> plot_width / (count - 1)
      end

    projected_points =
      points
      |> Enum.with_index()
      |> Enum.map(fn {point, index} ->
        x = left + step_x * index
        y = project_y(point.portfolio_value, value_floor, value_ceil, top, plot_height)

        Map.merge(point, %{
          x: x,
          y: y,
          display_date: format_date(point.date)
        })
      end)

    timeline_dates =
      Enum.map(points, & &1.date_obj) ++ Enum.map(year_end_entries, & &1.date_obj)

    first_date = Enum.min(timeline_dates, Date)
    last_date = Enum.max(timeline_dates, Date)

    projected_compound_points =
      year_end_entries
      |> Enum.sort_by(& &1.date_obj)
      |> Enum.map(fn entry ->
        x = project_x(entry.date_obj, first_date, last_date, left, plot_width)
        y = project_y(entry.amount, value_floor, value_ceil, top, plot_height)

        %{
          x: x,
          y: y,
          amount: entry.amount
        }
      end)

    projected_compound_points =
      case projected_compound_points do
        [] ->
          []

        points_with_data ->
          [
            %{
              x: left,
              y: project_y(0.0, value_floor, value_ceil, top, plot_height),
              amount: 0.0
            }
            | points_with_data
          ]
      end

    y_ticks =
      0..4
      |> Enum.map(fn tick ->
        ratio = tick / 4
        value = value_floor + (value_ceil - value_floor) * (1 - ratio)
        y = top + plot_height * ratio
        %{y: y, value: value}
      end)

    x_labels =
      projected_points
      |> Enum.reject(&Map.get(&1, :synthetic_start?, false))
      |> sampled_points(6)
      |> Enum.map(fn point -> %{x: point.x, label: point.display_date} end)

    line_path =
      projected_points
      |> Enum.map(&"#{svg_float(&1.x)} #{svg_float(&1.y)}")
      |> svg_line_path()

    compound_line_path =
      projected_compound_points
      |> Enum.map(&"#{svg_float(&1.x)} #{svg_float(&1.y)}")
      |> svg_line_path()

    baseline = top + plot_height

    area_path =
      case projected_points do
        [] ->
          ""

        [first | _] = series ->
          line_part =
            series
            |> Enum.map(&"#{svg_float(&1.x)} #{svg_float(&1.y)}")
            |> Enum.join(" L ")

          last = List.last(series)

          "M #{svg_float(first.x)} #{svg_float(baseline)} L " <>
            line_part <>
            " L #{svg_float(last.x)} #{svg_float(baseline)} Z"
      end

    %{
      width: width,
      height: height,
      line_path: line_path,
      compound_line_path: compound_line_path,
      area_path: area_path,
      y_ticks: y_ticks,
      x_labels: x_labels,
      points: projected_points,
      compound_points: projected_compound_points
    }
  end

  defp stats(points, all_entries) do
    total_contributed =
      points
      |> Enum.reject(&Map.get(&1, :synthetic_start?, false))
      |> Enum.reduce(0.0, fn point, acc -> acc + point.amount end)

    latest_contribution_value =
      points
      |> List.last()
      |> case do
        nil -> 0.0
        point -> point.portfolio_value
      end

    latest_total_value = latest_year_end_value(all_entries) || latest_contribution_value

    %{
      total_contributed: total_contributed,
      latest_value: latest_total_value,
      records: Enum.count(points, &(not Map.get(&1, :synthetic_start?, false))),
      year_end_marks: Enum.count(all_entries, & &1.year_end?)
    }
  end

  defp latest_year_end_value(entries) do
    entries
    |> Enum.filter(& &1.year_end?)
    |> List.last()
    |> case do
      nil -> nil
      entry -> entry.amount
    end
  end

  defp available_years(entries) do
    entries
    |> Enum.map(& &1.date_obj.year)
    |> Enum.uniq()
    |> Enum.sort(:desc)
  end

  defp year_options(years) do
    [{"All Years", "ALL"}] ++
      Enum.map(years, fn year -> {Integer.to_string(year), Integer.to_string(year)} end)
  end

  defp selected_filters(params) do
    selected_time_range =
      params["time_range"] || get_in(params, ["filters", "time_range"]) || "ALL"

    selected_year = params["year"] || get_in(params, ["filters", "year"]) || "ALL"

    normalized_time_range =
      if selected_time_range in @time_ranges, do: selected_time_range, else: "ALL"

    normalized_year = if valid_year_filter?(selected_year), do: selected_year, else: "ALL"

    {normalized_time_range, normalized_year}
  end

  defp filter_by_period(entries, _time_range, year) when year != "ALL" do
    year_int = String.to_integer(year)
    Enum.filter(entries, fn entry -> entry.date_obj.year == year_int end)
  end

  defp filter_by_period(entries, "ALL", "ALL"), do: entries

  defp filter_by_period(entries, time_range, "ALL") do
    start_date = filter_start_date(time_range)

    Enum.filter(entries, fn entry -> Date.compare(entry.date_obj, start_date) in [:eq, :gt] end)
  end

  defp filter_start_date(time_range) do
    reference_date = Date.utc_today()

    case time_range do
      "1M" -> Date.add(reference_date, -30)
      "3M" -> Date.add(reference_date, -90)
      "6M" -> Date.add(reference_date, -180)
      "YTD" -> Date.new!(reference_date.year, 1, 1)
      "12M" -> Date.add(reference_date, -365)
      _ -> Date.new!(1900, 1, 1)
    end
  end

  defp valid_year_filter?("ALL"), do: true

  defp valid_year_filter?(year) when is_binary(year) do
    case Integer.parse(year) do
      {value, ""} when value >= 1900 and value <= 3000 -> true
      _ -> false
    end
  end

  defp valid_year_filter?(_), do: false

  defp project_y(value, floor, ceil, top, plot_height) do
    ratio = if ceil == floor, do: 0.5, else: (value - floor) / (ceil - floor)
    top + plot_height * (1 - ratio)
  end

  defp project_x(date, first_date, last_date, left, plot_width) do
    span_days = max(Date.diff(last_date, first_date), 1)
    distance = Date.diff(date, first_date)
    raw_x = left + plot_width * distance / span_days

    raw_x
    |> max(left)
    |> min(left + plot_width)
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

  defp svg_line_path([]), do: ""

  defp svg_line_path([head | tail]) do
    "M #{head}" <> Enum.map_join(tail, "", &" L #{&1}")
  end

  defp format_date(date) do
    with {:ok, parsed_date} <- Date.from_iso8601(date) do
      Calendar.strftime(parsed_date, "%b %Y")
    else
      _ -> date
    end
  end

  defp parse_date(date) when is_binary(date) do
    case Date.from_iso8601(date) do
      {:ok, parsed_date} -> parsed_date
      _ -> nil
    end
  end

  defp parse_date(_date), do: nil

  defp numeric_amount(amount) when is_integer(amount), do: amount * 1.0
  defp numeric_amount(amount) when is_float(amount), do: amount
  defp numeric_amount(_amount), do: 0.0

  defp svg_float(value) when is_float(value), do: :erlang.float_to_binary(value, decimals: 2)
  defp svg_float(value) when is_integer(value), do: Integer.to_string(value)
end
