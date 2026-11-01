// SPDX-License-Identifier: GPL-3.0-only
/*
 *  NEXUX Launcher - Minecraft Launcher
 *  Copyright (C) 2026 NEXUX Launcher Contributors
 */
#pragma once

#include "FusionTheme.h"

class NexuxTheme : public FusionTheme {
   public:
    virtual ~NexuxTheme() {}

    QString id() override;
    QString name() override;
    QString tooltip() override;
    bool hasStyleSheet() override;
    QString appStyleSheet() override;
    QPalette colorScheme() override;
    double fadeAmount() override;
    QColor fadeColor() override;
};

