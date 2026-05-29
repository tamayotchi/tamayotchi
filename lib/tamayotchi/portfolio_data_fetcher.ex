defmodule Tamayotchi.PortfolioDataFetcher do
  @moduledoc """
  Background process that fetches the latest portfolio data from GitHub
  every 12 hours and caches it in memory.
  """

  use GenServer

  require Logger

  @default_fetch_interval :timer.hours(12)
  @github_raw_url "https://raw.githubusercontent.com/tamayotchi/tamayotchi/master/priv/data/data.json"

  # Client API

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @spec get_data() :: map() | nil
  def get_data(server \\ __MODULE__) do
    GenServer.call(server, :get_data)
  end

  @spec get_platform(binary()) :: {:ok, map()} | :error
  def get_platform(server \\ __MODULE__, provider_name) do
    GenServer.call(server, {:get_platform, provider_name})
  end

  # Server callbacks

  @impl true
  def init(_opts) do
    state = %{
      data: nil,
      url: @github_raw_url,
      fetch_interval: @default_fetch_interval
    }

    {:ok, state, {:continue, :fetch}}
  end

  @impl true
  def handle_continue(:fetch, state) do
    new_state = do_fetch(state)
    schedule_fetch(new_state.fetch_interval)
    {:noreply, new_state}
  end

  @impl true
  def handle_info(:fetch, state) do
    new_state = do_fetch(state)
    schedule_fetch(new_state.fetch_interval)
    {:noreply, new_state}
  end

  @impl true
  def handle_call(:get_data, _from, state) do
    {:reply, state.data, state}
  end

  @impl true
  def handle_call({:get_platform, provider_name}, _from, state) do
    result =
      case state.data do
        nil ->
          :error

        data ->
          case Map.get(data, provider_name) do
            %{} = provider_data -> {:ok, provider_data}
            _ -> :error
          end
      end

    {:reply, result, state}
  end

  defp schedule_fetch(interval) do
    Process.send_after(self(), :fetch, interval)
  end

  defp do_fetch(state) do
    case Req.get(state.url) do
      {:ok, %{status: 200, body: body}} ->
        case Jason.decode(body) do
          {:ok, data} when is_map(data) ->
            Logger.info("PortfolioDataFetcher: successfully fetched and cached portfolio data")
            %{state | data: data}

          {:ok, data} ->
            Logger.error("PortfolioDataFetcher: unexpected body type: #{inspect(data)}")
            state

          {:error, reason} ->
            Logger.error("PortfolioDataFetcher: JSON decode error: #{inspect(reason)}")
            state
        end

      {:ok, %{status: status}} ->
        Logger.error("PortfolioDataFetcher: HTTP #{status} from GitHub")
        state

      {:error, reason} ->
        Logger.error("PortfolioDataFetcher: request failed: #{inspect(reason)}")
        state
    end
  end
end
