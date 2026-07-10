defmodule TamayotchiWeb.PageControllerTest do
  use TamayotchiWeb.ConnCase

  test "GET / renders the homepage with locked portfolio totals", %{conn: conn} do
    conn = get(conn, ~p"/")
    response = html_response(conn, 200)

    assert response =~ "TAMAYOTCHI"
    assert response =~ "project-examples"
    assert response =~ "Instaleap"
    assert response =~ "https://instaleap.io"
    assert response =~ "acquired by Instacart"
    assert response =~ "Prezio"
    assert response =~ "https://prezio.tamayotchi.com/"
    assert response =~ "Elixir-powered"
    assert response =~ "Zapenu"
    assert response =~ "https://zapenu.com/lepancake/gKhixyg"
    assert response =~ "Nativo Studio"
    assert response =~ "private portfolio telemetry"
    refute response =~ "Tamayotchi Portfolio OS"
    assert response =~ "WhatsApp Reminders"
    assert response =~ "https://github.com/tamayotchi/WhatsAppReminders"
    assert response =~ "CodTracker Bot"
    assert response =~ "https://github.com/tamayotchi/CodTracker-Bot"
    refute response =~ "Open project"
    refute response =~ "Aleph"
    refute response =~ "Selected work"
    refute response =~ "Projects &amp; Experience"
    assert response =~ "portfolio-unlock-form"
    assert response =~ "Private telemetry"
    assert response =~ "•••••• USD"
    assert response =~ "portfolio-private-lock-card"
    refute response =~ "portfolio-totals-values"
    refute response =~ "investment-platforms-values"
    refute response =~ "BRICKSAVE"
    refute response =~ "ETORO"
    refute response =~ "/provider/"

    {projects_index, _} = :binary.match(response, "project-examples")
    {telemetry_index, _} = :binary.match(response, "portfolio-totals")
    assert projects_index < telemetry_index
  end

  test "POST /portfolio/unlock rejects an invalid password", %{conn: conn} do
    conn = post(conn, ~p"/portfolio/unlock", %{portfolio_unlock: %{password: "wrong"}})

    assert redirected_to(conn) == "/#portfolio-totals"
    refute get_session(conn, :portfolio_unlocked)
  end

  test "POST /portfolio/unlock unlocks totals for the browser session", %{conn: conn} do
    conn = post(conn, ~p"/portfolio/unlock", %{portfolio_unlock: %{password: "tamayotchi"}})

    assert redirected_to(conn) == "/#portfolio-totals"
    assert get_session(conn, :portfolio_unlocked) == true

    conn = get(recycle(conn), ~p"/")
    response = html_response(conn, 200)

    assert response =~ "portfolio-totals-values"
    assert response =~ "investment-platforms-values"
    assert response =~ "All USD overview"
    assert response =~ "/provider/usd"
    assert response =~ "All COP overview"
    assert response =~ "/provider/cop"
    assert response =~ "ETORO"
    refute response =~ "portfolio-private-lock-card"
  end

  test "GET /salary redirects locked sessions to the homepage unlock card", %{conn: conn} do
    conn = get(conn, ~p"/salary")

    assert redirected_to(conn) == "/#portfolio-totals"
    assert get_session(conn, :portfolio_return_to) == "/salary"
  end

  test "GET /salary renders after portfolio unlock", %{conn: conn} do
    conn =
      conn
      |> init_test_session(%{portfolio_unlocked: true})
      |> get(~p"/salary")

    response = html_response(conn, 200)

    assert response =~ "Salary Counter"
    assert response =~ "Monthly Salary"
  end

  test "GET /provider/:provider redirects locked sessions to the homepage unlock card", %{
    conn: conn
  } do
    conn = get(conn, ~p"/provider/etoro")

    assert redirected_to(conn) == "/#portfolio-totals"
    assert get_session(conn, :portfolio_return_to) == "/provider/etoro"
  end

  test "GET /provider/usd redirects locked sessions to the homepage unlock card", %{conn: conn} do
    conn = get(conn, ~p"/provider/usd?year=2026")

    assert redirected_to(conn) == "/#portfolio-totals"
    assert get_session(conn, :portfolio_return_to) == "/provider/usd?year=2026"
  end

  test "GET /provider/cop redirects locked sessions to the homepage unlock card", %{conn: conn} do
    conn = get(conn, ~p"/provider/cop?year=2026")

    assert redirected_to(conn) == "/#portfolio-totals"
    assert get_session(conn, :portfolio_return_to) == "/provider/cop?year=2026"
  end

  test "GET /provider/:provider renders after portfolio unlock", %{conn: conn} do
    conn =
      conn
      |> init_test_session(%{portfolio_unlocked: true})
      |> get(~p"/provider/etoro")

    response = html_response(conn, 200)

    assert response =~ "ETORO"
    assert response =~ "Performance Curve"
  end

  test "provider history filters by year and defaults to newest first", %{conn: conn} do
    conn =
      conn
      |> init_test_session(%{portfolio_unlocked: true})
      |> get(~p"/provider/etoro?year=2026")

    response = html_response(conn, 200)

    assert response =~ "Year 2026"
    assert response =~ "Newest first"
    refute response =~ "February 1, 2025"

    assert_response_order(response, [
      "July 9, 2026",
      "June 25, 2026",
      "March 10, 2026"
    ])
  end

  test "provider history can be sorted oldest first", %{conn: conn} do
    conn =
      conn
      |> init_test_session(%{portfolio_unlocked: true})
      |> get(~p"/provider/etoro?year=2026&history_order=oldest")

    response = html_response(conn, 200)

    assert response =~ "Year 2026"

    assert_response_order(response, [
      "March 10, 2026",
      "June 25, 2026",
      "July 9, 2026"
    ])
  end

  test "provider USD aggregate shows a breakdown for USD platforms only", %{conn: conn} do
    conn =
      conn
      |> init_test_session(%{portfolio_unlocked: true})
      |> get(~p"/provider/usd?year=2026")

    response = html_response(conn, 200)

    assert response =~ "USD INVESTMENTS"
    assert response =~ "USD Provider Breakdown"
    assert response =~ "Year 2026"
    assert response =~ "1,360.00 USD"
    assert response =~ "ETORO"
    assert response =~ "1,260.00 USD"
    assert response =~ "XTB"
    assert response =~ "100.00 USD"
    assert response =~ "BRICKSAVE"
    refute response =~ "TRII"

    assert_response_order(response, [
      "July 9, 2026",
      "June 25, 2026",
      "April 16, 2026",
      "March 10, 2026"
    ])
  end

  test "provider USD aggregate supports oldest-first history", %{conn: conn} do
    conn =
      conn
      |> init_test_session(%{portfolio_unlocked: true})
      |> get(~p"/provider/usd?year=2026&history_order=oldest")

    response = html_response(conn, 200)

    assert response =~ "USD INVESTMENTS"

    assert_response_order(response, [
      "March 10, 2026",
      "April 16, 2026",
      "June 25, 2026",
      "July 9, 2026"
    ])
  end

  test "provider COP aggregate shows a breakdown for COP platforms only", %{conn: conn} do
    conn =
      conn
      |> init_test_session(%{portfolio_unlocked: true})
      |> get(~p"/provider/cop?year=2026")

    response = html_response(conn, 200)

    assert response =~ "COP INVESTMENTS"
    assert response =~ "COP Provider Breakdown"
    assert response =~ "Year 2026"
    assert response =~ "1,000,000.00 COP"
    assert response =~ "TRII"
    assert response =~ "A2CENSO"
    refute response =~ "ETORO"
    refute response =~ "XTB"

    assert_response_order(response, [
      "May 14, 2026",
      "Total"
    ])
  end

  test "provider return path is used after a successful unlock", %{conn: conn} do
    conn = get(conn, ~p"/provider/etoro")

    conn =
      conn
      |> recycle()
      |> post(~p"/portfolio/unlock", %{portfolio_unlock: %{password: "tamayotchi"}})

    assert redirected_to(conn) == "/provider/etoro"
    assert get_session(conn, :portfolio_unlocked) == true
  end

  defp assert_response_order(response, expected_values) do
    indexes =
      Enum.map(expected_values, fn value ->
        case :binary.match(response, value) do
          {index, _length} -> index
          :nomatch -> flunk("Expected #{inspect(value)} to be present in the response")
        end
      end)

    assert indexes == Enum.sort(indexes)
  end
end
