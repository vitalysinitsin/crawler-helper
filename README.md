# Crawler Helper

A simple Python-based crawler runner that provides a structured entry point for running platform-specific crawlers.

## ✨ Overview

This project acts as an orchestration layer for web crawlers. It handles:

- Selecting the correct crawler implementation
- Initializing configuration and dependencies
- Running the crawler asynchronously
- Managing optional data persistence (e.g. database)

Instead of being a full scraping framework, this tool focuses on **coordinating crawler execution**.

---

## 🏗️ Architecture

The project follows a simple pattern:

- **CrawlerFactory** → maps platform names to crawler implementations  
- **Main runner** → initializes config, DB, and starts the crawler  
- **Crawler classes** → implement platform-specific logic  

## 📄 License

MIT
