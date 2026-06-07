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

  test "GET /provider/:provider renders after portfolio unlock", %{conn: conn} do
    conn =
      conn
      |> init_test_session(%{portfolio_unlocked: true})
      |> get(~p"/provider/etoro")

    response = html_response(conn, 200)

    assert response =~ "ETORO"
    assert response =~ "Performance Curve"
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
end
