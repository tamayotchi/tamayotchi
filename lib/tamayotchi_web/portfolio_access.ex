defmodule TamayotchiWeb.PortfolioAccess do
  @moduledoc """
  Small server-side access helper for portfolio-only private content.

  The homepage remains public, but sensitive totals and provider detail pages share
  this session-backed unlock flag. Password validation happens on the server and
  the password itself is read from runtime application configuration.
  """

  import Plug.Conn

  @session_key :portfolio_unlocked
  @return_to_key :portfolio_return_to

  @doc "Returns true when the current browser session unlocked private portfolio content."
  def unlocked?(conn), do: get_session(conn, @session_key) == true

  @doc "Marks private portfolio content as unlocked for this session."
  def unlock(conn), do: put_session(conn, @session_key, true)

  @doc "Stores a safe local path to visit after a successful unlock."
  def remember_return_to(conn, path) when is_binary(path) do
    put_session(conn, @return_to_key, safe_return_to(path))
  end

  def remember_return_to(conn, _path), do: conn

  @doc "Reads and clears the remembered post-unlock destination."
  def pop_return_to(conn) do
    {get_session(conn, @return_to_key), delete_session(conn, @return_to_key)}
  end

  @doc "Validates a user-submitted password against runtime configuration."
  def valid_password?(candidate) when is_binary(candidate) do
    case Application.fetch_env(:tamayotchi, :portfolio_password) do
      {:ok, expected} when is_binary(expected) and expected != "" ->
        secure_compare(candidate, expected)

      _ ->
        false
    end
  end

  def valid_password?(_candidate), do: false

  @doc "Normalizes redirects to local paths only."
  def safe_return_to(path) when is_binary(path) do
    cond do
      path == "" -> "/#portfolio-totals"
      String.starts_with?(path, "//") -> "/#portfolio-totals"
      String.starts_with?(path, "/") -> path
      true -> "/#portfolio-totals"
    end
  end

  def safe_return_to(_path), do: "/#portfolio-totals"

  defp secure_compare(left, right) do
    left_hash = :crypto.hash(:sha256, left)
    right_hash = :crypto.hash(:sha256, right)

    Plug.Crypto.secure_compare(left_hash, right_hash)
  end
end
