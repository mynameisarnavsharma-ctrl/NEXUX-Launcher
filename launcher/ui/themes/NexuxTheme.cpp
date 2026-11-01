// SPDX-License-Identifier: GPL-3.0-only
/*
 *  NEXUX Launcher - Minecraft Launcher
 *  Copyright (C) 2026 NEXUX Launcher Contributors
 */
#include "NexuxTheme.h"

#include <QObject>

QString NexuxTheme::id()
{
    return "nexux_neon";
}

QString NexuxTheme::name()
{
    return QObject::tr("NEXUX Cyber Neon");
}

QPalette NexuxTheme::colorScheme()
{
    QPalette pal;
    pal.setColor(QPalette::Window, QColor(13, 25, 41));         // #0d1929
    pal.setColor(QPalette::WindowText, QColor(241, 245, 249));     // #f1f5f9
    pal.setColor(QPalette::Base, QColor(6, 11, 19));             // #060b13
    pal.setColor(QPalette::AlternateBase, QColor(15, 23, 42));    // #0f172a
    pal.setColor(QPalette::ToolTipBase, QColor(10, 20, 36));      // #0a1424
    pal.setColor(QPalette::ToolTipText, QColor(0, 240, 255));     // #00f0ff
    pal.setColor(QPalette::Text, QColor(248, 250, 252));         // #f8fafc
    pal.setColor(QPalette::Button, QColor(22, 35, 56));          // #162338
    pal.setColor(QPalette::ButtonText, QColor(248, 250, 252));
    pal.setColor(QPalette::BrightText, QColor(0, 240, 255));     // #00f0ff
    pal.setColor(QPalette::Link, QColor(56, 189, 248));          // #38bdf8
    pal.setColor(QPalette::Highlight, QColor(0, 168, 255));      // #00a8ff
    pal.setColor(QPalette::HighlightedText, Qt::white);
    pal.setColor(QPalette::PlaceholderText, QColor(100, 116, 139));
    return fadeInactive(pal, fadeAmount(), fadeColor());
}

double NexuxTheme::fadeAmount()
{
    return 0.5;
}

QColor NexuxTheme::fadeColor()
{
    return QColor(6, 11, 19);
}

bool NexuxTheme::hasStyleSheet()
{
    return true;
}

QString NexuxTheme::appStyleSheet()
{
    return QStringLiteral(
        "QMainWindow, QDialog, QWidget#centralWidget { background-color: #060b13; color: #f1f5f9; }"
        "QMenuBar { background-color: #09111c; color: #94a3b8; border-bottom: 1px solid #14243b; }"
        "QMenuBar::item:selected { background-color: #162a45; color: #00f0ff; border-radius: 4px; }"
        "QMenu { background-color: #09111c; color: #f1f5f9; border: 1px solid #00f0ff; border-radius: 8px; padding: 6px; }"
        "QMenu::item:selected { background: qlineargradient(spread:pad, x1:0, y1:0, x2:1, y2:0, stop:0 #0055ff, stop:1 #00f0ff); color: #ffffff; }"
        "QToolBar { background: qlineargradient(spread:pad, x1:0, y1:0, x2:0, y2:1, stop:0 #0d1929, stop:1 #060b13); border-bottom: 1px solid #14243b; spacing: 6px; padding: 4px; }"
        "QToolButton { background-color: #0d1929; border: 1px solid #1e3a5f; border-radius: 6px; color: #f1f5f9; font-weight: 600; padding: 5px 10px; }"
        "QToolButton:hover { border: 1px solid #00f0ff; color: #00f0ff; background-color: #163e6e; }"
        "QToolButton:pressed, QToolButton:checked { background-color: #0055ff; border: 1px solid #00f0ff; color: #ffffff; }"
        "QListView, QTreeView, QTableView { background-color: #060b13; border: 1px solid #14243b; border-radius: 10px; color: #f8fafc; selection-background-color: #0055ff; }"
        "QListView::item { background-color: #0c1626; border: 1px solid #1a304d; border-radius: 8px; margin: 3px; padding: 6px; }"
        "QListView::item:hover { border: 1px solid #00f0ff; background-color: #16365c; color: #00f0ff; }"
        "QListView::item:selected { background: qlineargradient(spread:pad, x1:0, y1:0, x2:1, y2:1, stop:0 #0055ff, stop:1 #00a8ff); border: 1px solid #00f0ff; color: #ffffff; font-weight: bold; }"
        "QPushButton { background: qlineargradient(spread:pad, x1:0, y1:0, x2:1, y2:0, stop:0 #0055cc, stop:1 #0088ff); border: 1px solid #00c8ff; border-radius: 6px; color: #ffffff; font-weight: bold; padding: 6px 16px; }"
        "QPushButton:hover { background: qlineargradient(spread:pad, x1:0, y1:0, x2:1, y2:0, stop:0 #0066ee, stop:1 #00f0ff); border: 1px solid #ffffff; }"
        "QPushButton:pressed { background-color: #004499; }"
        "QLineEdit, QTextEdit, QPlainTextEdit, QSpinBox { background-color: #08101a; border: 1px solid #1a304d; border-radius: 6px; padding: 5px 8px; color: #f8fafc; }"
        "QLineEdit:focus, QTextEdit:focus { border: 1px solid #00f0ff; }"
        "QComboBox { background-color: #0d1929; border: 1px solid #1a304d; border-radius: 6px; padding: 5px 10px; color: #f8fafc; }"
        "QComboBox:hover { border: 1px solid #00f0ff; }"
        "QTabWidget::pane { border: 1px solid #14243b; border-radius: 6px; background-color: #060b13; }"
        "QTabBar::tab { background-color: #0d1929; border: 1px solid #14243b; border-top-left-radius: 6px; border-top-right-radius: 6px; padding: 6px 14px; margin-right: 3px; color: #94a3b8; }"
        "QTabBar::tab:selected { color: #ffffff; background-color: #060b13; border: 1px solid #00f0ff; border-bottom: 2px solid #00f0ff; font-weight: bold; }"
        "QProgressBar { background-color: #0a1424; border: 1px solid #14243b; border-radius: 5px; text-align: center; color: #ffffff; font-weight: bold; height: 14px; }"
        "QProgressBar::chunk { background: qlineargradient(spread:pad, x1:0, y1:0, x2:1, y2:0, stop:0 #0055ff, stop:1 #00f0ff); border-radius: 4px; }"
        "QScrollBar:vertical { background-color: #060b13; width: 8px; border-radius: 4px; }"
        "QScrollBar::handle:vertical { background-color: #1e3a5f; border-radius: 4px; min-height: 20px; }"
        "QScrollBar::handle:vertical:hover { background-color: #00f0ff; }"
        "QToolTip { background-color: #0a1424; color: #00f0ff; border: 1px solid #00f0ff; border-radius: 4px; padding: 4px 8px; }"
    );
}

QString NexuxTheme::tooltip()
{
    return QObject::tr("Official NEXUX Cyberpunk Neon Theme");
}
