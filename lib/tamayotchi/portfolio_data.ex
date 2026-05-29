defmodule Tamayotchi.PortfolioData do
  @moduledoc """
  Loads portfolio data from the in-memory cache (PortfolioDataFetcher)
  or falls back to the local static file.
  """

  @app :tamayotchi

  @spec load() :: {:ok, map()} | {:error, term()}
  def load do
    if fetcher_running?() do
      case Tamayotchi.PortfolioDataFetcher.get_data() do
        nil -> load_from_file()
        data -> {:ok, data}
      end
    else
      load_from_file()
    end
  end

  @spec platform(binary()) :: {:ok, map()} | :error
  def platform(provider_name) when is_binary(provider_name) do
    if fetcher_running?() do
      case Tamayotchi.PortfolioDataFetcher.get_platform(provider_name) do
        {:ok, provider_data} -> {:ok, provider_data}
        :error -> platform_from_file(provider_name)
      end
    else
      platform_from_file(provider_name)
    end
  end

  @spec path() :: binary()
  def path do
    Path.join([to_string(:code.priv_dir(@app)), "data", "data.json"])
  end

  # Private

  defp fetcher_running? do
    Process.whereis(Tamayotchi.PortfolioDataFetcher) != nil
  end

  defp load_from_file do
    with {:ok, json} <- File.read(path()),
         {:ok, data} <- Jason.decode(json) do
      {:ok, data}
    end
  end

  defp platform_from_file(provider_name) do
    with {:ok, data} <- load_from_file(),
         %{} = provider_data <- Map.get(data, provider_name) do
      {:ok, provider_data}
    else
      _ -> :error
    end
  end
end
