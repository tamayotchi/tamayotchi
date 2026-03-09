defmodule Tamayotchi.PortfolioData do
  @moduledoc false

  @app :tamayotchi

  @spec load() :: {:ok, map()} | {:error, term()}
  def load do
    with {:ok, json} <- File.read(path()),
         {:ok, data} <- Jason.decode(json) do
      {:ok, data}
    end
  end

  @spec platform(binary()) :: {:ok, map()} | :error
  def platform(provider_name) when is_binary(provider_name) do
    with {:ok, data} <- load(),
         %{} = provider_data <- Map.get(data, provider_name) do
      {:ok, provider_data}
    else
      _ -> :error
    end
  end

  @spec path() :: binary()
  def path do
    Path.join([to_string(:code.priv_dir(@app)), "data", "data.json"])
  end
end
