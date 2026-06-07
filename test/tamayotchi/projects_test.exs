defmodule Tamayotchi.ProjectsTest do
  use ExUnit.Case, async: true

  alias Tamayotchi.Projects

  test "loads projects from markdown files in filename order" do
    projects = Projects.all_projects()

    assert Enum.map(projects, & &1.id) == [
             "project-prezio",
             "project-robert",
             "project-zapenu",
             "project-tamayotchi-portfolio-os",
             "project-whatsapp-reminders",
             "project-codtracker-bot"
           ]

    assert Enum.map(projects, & &1.title) == [
             "Prezio",
             "Nativo Studio",
             "Zapenu",
             "Tamayotchi",
             "WhatsApp Reminders",
             "CodTracker Bot"
           ]
  end

  test "loads optional project link and image metadata" do
    projects = Projects.all_projects()
    prezio = Enum.find(projects, &(&1.id == "project-prezio"))
    zapenu = Enum.find(projects, &(&1.id == "project-zapenu"))
    whatsapp_reminders = Enum.find(projects, &(&1.id == "project-whatsapp-reminders"))
    codtracker_bot = Enum.find(projects, &(&1.id == "project-codtracker-bot"))
    robert = Enum.find(projects, &(&1.id == "project-robert"))

    assert prezio.url == "https://prezio.tamayotchi.com/"
    assert prezio.image == "/images/projects/prezio-preview.png"
    assert prezio.body =~ "Elixir-powered"
    assert prezio.body =~ "<ul>"
    assert prezio.body =~ "Built with Elixir"

    assert zapenu.url == "https://zapenu.com/lepancake/gKhixyg"
    assert zapenu.image == "/images/projects/zapenu-preview.png"
    assert zapenu.body =~ "menu-commerce"

    assert whatsapp_reminders.url == "https://github.com/tamayotchi/WhatsAppReminders"
    assert whatsapp_reminders.image == "/images/projects/whatsapp-reminders-demo.png"

    assert codtracker_bot.url == "https://github.com/tamayotchi/CodTracker-Bot"
    assert codtracker_bot.image == "/images/projects/codtracker-bot-demo.png"

    assert robert.title == "Nativo Studio"
    assert robert.image == "/images/projects/robert-demo.png"
  end
end
