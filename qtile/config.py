# -*- coding: utf-8 -*-
#          _______      _        _______  _
# |\     /|(  ____ \    ( (    /|(  ___  )( (    /|
# ( \   / )| (    \/    |  \  ( || (   ) ||  \  ( |
#  \ (_) / | (__  _____ |   \ | || |   | ||   \ | |
#   ) _ (  |  __)(_____)| (\ \) || |   | || (\ \) |
#  / ( ) \ | (          | | \   || |   | || | \   |
# ( /   \ )| (____/\    | )  \  || (___) || )  \  |
# |/     \|(_______/    |/    )_)(_______)|/    )_)
#
#
# The following comments are the copyright and licensing information from the default
# qtile config. Copyright (c) 2010 Aldo Cortesi, 2010, 2014 dequis, 2012 Randall Ma,
# 2012-2014 Tycho Andersen, 2012 Craig Barnes, 2013 horsik, 2013 Tao Sauvage
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this
# software and associated documentation files (the "Software"), to deal in the Software
# without restriction, including without limitation the rights to use, copy, modify,
# merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject to the following
# conditions:
#
# The above copyright notice and this permission notice shall be included in all copies
# or substantial portions of the Software.
#
# Forked by gitlab.com/dwt1/dotfiles/raw/master/.config/qtile/config.py xD
#

##### IMPORTS #####

import os
import re
import socket
import subprocess
from libqtile.config import Key, Screen, Group, Drag, Click , Match
from libqtile.command import lazy
from libqtile import layout, bar, widget, hook
from libqtile.widget import Spacer 

##### DEFINING SOME WINDOW FUNCTIONS #####

@lazy.function
def window_to_prev_group(qtile):
    if qtile.currentWindow is not None:
        i = qtile.groups.index(qtile.currentGroup)
        qtile.currentWindow.togroup(qtile.groups[i - 1].name)

@lazy.function
def window_to_next_group(qtile):
    if qtile.currentWindow is not None:
        i = qtile.groups.index(qtile.currentGroup)
        qtile.currentWindow.togroup(qtile.groups[i + 1].name)

##### LAUNCH APPS IN SPECIFIED GROUPS #####

def app_or_group(group, app):
    def f(qtile):
        if qtile.groupMap[group].windows:
            qtile.groupMap[group].cmd_toscreen()
        else:
            qtile.groupMap[group].cmd_toscreen()
            qtile.cmd_spawn(app)
    return f

##### KEYBINDINGS #####

def init_keys():
    keys = [
            Key(
                [mod], "Return",
                lazy.spawn(myTerm)                        # Open terminal
                ),
            Key(
                [mod, "shift"], "Tab",
                lazy.next_layout()                        # Toggle through layouts
                ),
            Key(
                [mod, "shift"], "q",
                lazy.window.kill()                        # Kill active window
                ),
            Key(
                [mod, "shift"], "r",
                lazy.restart()                            # Restart Qtile
                ),
            Key(
                [mod, "shift"], "Escape",
                lazy.shutdown()                           # Shutdown Qtile
                ),
            Key([mod], "F1",
                lazy.to_screen(0)                         # Keyboard focus screen(1) xD
                ),
            Key([mod], "F2",
                lazy.to_screen(1)                         # Keyboard focus screen(2) xD
                ),
            Key([mod], "F3",
                lazy.to_screen(3)                         # Keyboard focus screen(3) xD
                ),
            Key([mod, "control"], "k",
                lazy.layout.section_up()                          # Move up a section in treetab
                ),
            Key([mod, "control"], "j",
                lazy.layout.section_down()                        # Move down a section in treetab
                ),
            # Window controls
            Key(
                [mod], "k",
                lazy.layout.down()                        # Switch between windows in current stack pane
                ),
            Key(
                [mod], "j",
                lazy.layout.up()                          # Switch between windows in current stack pane
                ),
            Key(
                [mod], "h",
                lazy.layout.right()                        # Switch between windows in current stack pane
                ),
            Key(
                [mod], "l",
                lazy.layout.left()                          # Switch between windows in current stack pane
                ),
            Key(
                [mod, "shift"], "k",
                lazy.layout.shuffle_down()                # Move windows down in current stack
                ),
            Key(
                [mod, "shift"], "j",
                lazy.layout.shuffle_up()                  # Move windows up in current stack
                ),
            Key(
                [mod, "shift"], "h",
                lazy.layout.shuffle_left()                # Move windows left in current stack 
                ),
            Key(
                [mod, "shift"], "l",
                lazy.layout.shuffle_right()                  # Move windows rigth in current stack 
        ),
            Key(
                [mod], "Left",
                lazy.layout.grow(),                       # Grow size of current window (XmonadTall)
                lazy.layout.increase_nmaster(),           # Increase number in master pane (Tile)
                ),
            Key(
                [mod], "Right",
                lazy.layout.shrink(),                     # Shrink size of current window (XmonadTall)
                lazy.layout.decrease_nmaster(),           # Decrease number in master pane (Tile)
                ),
            Key(
                [mod, "shift"], "Left",                   # Move window to workspace to the left
                window_to_prev_group
                ),
            Key(
                [mod, "shift"], "Right",                  # Move window to workspace to the right
                window_to_next_group
                ),
            Key(
                [mod], "n",
                lazy.layout.normalize()                   # Restore all windows to default size ratios
                ),
            Key(
                [mod], "m",
                lazy.layout.maximize()                    # Toggle a window between minimum and maximum sizes
                ),
            Key(
                [mod, "shift"], "KP_Enter",
                lazy.window.toggle_floating()             # Toggle floating
                ),
            Key(
                [mod], "Tab",
                lazy.layout.rotate(),                     # Swap panes of split stack (Stack) xD
                lazy.layout.flip()                        # Switch which side main pane occupies (XmonadTall)
                ),
            # Stack controls
            Key(
                [mod], "o",
                lazy.layout.next()                        # Switch window focus to other pane(s) of stack
                ),
            Key(
                [mod, "control"], "Return",
                lazy.layout.toggle_split()                # Toggle between split and unsplit sides of stack
                ),

            # GUI Apps

            Key(
                [mod], "w",
                lazy.function(app_or_group("WWW", "firefox"))
                ),
            Key(
                [mod], "f",
                lazy.function(app_or_group("SYS" , "thunar"))
                ),
            Key(
                [mod], "g",
                lazy.spawn("geany")
                ),
        Key(
                [mod], "q",
                lazy.spawn("rofi -show run")
                ),

        # Lock the screen

        Key(
                [mod], "F6",
                lazy.spawn("i3lock -e -f -c 1d2021 && pauseallmpv && mpc pause")
                ),

        #hibernate        

        Key(
                [mod], "F8",
                lazy.spawn("systemctl suspend"),
                lazy.spawn("i3lock -e -f -c 1d2021 && pauseallmpv && mpc pause")
                ), 

        #shutdown      

        Key(
                [mod], "F9",
                lazy.spawn("shutdown -h now")
                ),

        #reboot        

        Key(
                [mod], "F11",
                lazy.spawn("reboot")
                ),                      
            # Apps Launched with <SUPER> + <KEYPAD 0-9> || I Removed It xD
        ]
    return keys

##### BAR COLORS #####

def init_colors():
    return [["#1D2330", "#1D2330"], # panel background
            ["#84598D", "#84598D"], # background for current screen tab
            ["#B1B5C8", "#B1B5C8"], # font color for group names
            ["#645377", "#645377"], # background color for layout widget
            ["#000000", "#000000"], # background for other screen tabs
            ["#AD69AF", "#AD69AF"], # dark green gradiant for other screen tabs
            ["#7B8290", "#7B8290"], # background color for network widget
            ["#AD69AF", "#AD69AF"], # background color for pacman widget
            ["#357FC5", "#357FC5"], # background color for cmus widget
            ["#000000", "#000000"], # background color for clock widget
            ["#84598d", "#84598d"]] # background color for systray widget

##### GROUPS #####

def init_group_names():
    return [("DEV", {
        'layout': 'max',
                'matches': [Match(wm_class=['Leafpad',
                        'Code',
                        'Vim',
                        'Gvim'
                        ])],
            }),
            ("WWW", {
        'layout': 'max',
                'matches': [Match(wm_class=['Firefox',
                        'Chromium',
                        'Opera',
                        'Surf'
                        ])],
           }),
            ("SYS", {
        'layout': 'monadtall',
                'matches': [Match(wm_class=['Thunar'
                        ])],
           }),
            ("DOC", {
        'layout': 'monadtall',
                'matches': [Match(wm_class=['Okular'
                        ])],
          }),
            ("VBOX", {
        'layout': 'floating',
                'matches': [Match(wm_class=['VirtualBox',
                        'Vmware'
                        ])],
          }),
            ("CHAT", {
        'layout': 'bsp',
                'matches': [Match(wm_class=['Discord'
                        ])],
         }),
            ("MEDIA", {
        'layout': 'monadtall',
                'matches': [Match(wm_class=['Mpv',
                        'Clementine',
                        'Nomacs'
                        ])],
         }),
            ("GFX", {
        'layout': 'floating',
                'matches': [Match(wm_class=['Gimp',
                        'Kdenlive'
                        ])],
        })]

def init_groups():
    return [Group(name, **kwargs) for name, kwargs in group_names]


##### LAYOUTS #####

def init_floating_layout():
    return layout.Floating(border_focus="#3B4022")

def init_layout_theme():
    return {"border_width": 2,
            "margin": 10,
            "border_focus": "AD69AF",
            "border_normal": "1D2330"
           }

def init_border_args():
    return {"border_width": 2}

def init_layouts():
    return [layout.Max(**layout_theme),
            layout.MonadTall(**layout_theme),
            layout.MonadWide(**layout_theme),
            layout.Bsp(**layout_theme),
            layout.TreeTab(
                font = "Ubuntu",
                fontsize = 10,
                sections = ["FIRST", "SECOND"],
                section_fontsize = 11,
                bg_color = "141414",
                active_bg = "90C435",
                active_fg = "000000",
                inactive_bg = "384323",
                inactive_fg = "a0a0a0",
                padding_y = 5,
                section_top = 10,
                panel_width = 320,
                **layout_theme
                ),
            layout.Slice(side="left", width=192, name="gimp", role="gimp-toolbox",
                fallback=layout.Slice(side="right", width=256, role="gimp-dock",
                fallback=layout.Stack(num_stacks=1, **border_args))),
            #layout.Stack(stacks=2, **layout_theme),
            #layout.Columns(**layout_theme),
            #layout.RatioTile(**layout_theme),
            #layout.VerticalTile(**layout_theme),
            #layout.Tile(shift_windows=True, **layout_theme),
            #layout.Matrix(**layout_theme),
            #layout.Zoomy(**layout_theme),
            layout.Floating(**layout_theme)]

##### WIDGETS #####

def init_widgets_defaults():
    return dict(font="Ubuntu Mono",
                fontsize = 11,
                padding = 2,
                background=colors[2])

# Forked by github.com/meduardor/dotfiles/blob/d04a59359530c0918d9eff7cd22dc883b1d8df6d/.config/qtile/config.py%7E#L141 xD

def init_widgets_list():
    prompt = "{0}@{1}: ".format(os.environ["USER"], socket.gethostname())
    widgets_list = [
                widget.Sep(
                        linewidth = 0,
                        padding = 6,
                        foreground = colors[2],
                        background = colors[0]
                        ),     
                widget.GroupBox(font="Ubuntu Bold",
                        fontsize = 9,
                        margin_y = 0,
                        margin_x = 0,
                        padding_y = 9,
                        padding_x = 5,
                        borderwidth = 1,
                        active = colors[2],
                        inactive = colors[2],
                        rounded = False,
                        highlight_method = "block",
                        this_current_screen_border = colors[1],
                        this_screen_border = colors [4],
                        other_current_screen_border = colors[0],
                        other_screen_border = colors[0],
                        foreground = colors[2],
                        background = colors[0]
                        ),
                widget.Sep(
                        linewidth = 0,
                        padding = 10,
                        foreground = colors[2],
                        background = colors[0]
                        ),        
                widget.Prompt(
                        prompt=prompt,
                        font="Ubuntu Mono",
                        padding=10,
                        foreground = colors[3],
                        background = colors[1]
                        ),            
                widget.TextBox(
                        "◢",
                        fontsize=55,
                        font='TerminessTTF Nerd Font',
                        foreground="#ffffff",
                        background = colors[0],
                        padding=-2,
                        ),
                widget.TextBox(
                        "◤ ",
                        fontsize=55,
                        font='TerminessTTF Nerd Font',
                        foreground="#ffffff",
                        background = colors[0],
                        padding=-5,
                ),
                widget.Prompt(
                        fontsize=12,
                        max_history=20,
                        record_history=True,
                        prompt='run: ',
                        font='TerminessTTF Nerd Font',
                ),
                widget.WindowName(font="Ubuntu",
                        fontsize = 11,
                        foreground = colors[5],
                        background = colors[0],
                        padding = 6
                        ),
                widget.Systray(
                        background=colors[0],
                        padding = 6
                        ),        
                widget.TextBox(
                        "◢",
                        fontsize=55,
                        font='TerminessTTF Nerd Font',
                        foreground="#ffffff",
                        background = colors[0],
                        padding=-2,
                        ),
                widget.CurrentLayout(
                        padding=0,
                        fontsize=12,
                        background="#ffffff",
                        foreground="#282828",
                        font='TerminessTTF Nerd Font',
                        ),
                widget.TextBox(
                        "◤",
                        fontsize=55,
                        font='TerminessTTF Nerd Font',
                        foreground="#ffffff",
                        padding=-5,
                        ),
                widget.TextBox(
                        "◢",
                        fontsize=55,
                        font='TerminessTTF Nerd Font',
                        foreground="#ffffff",
                        padding=-2,
                        ),
                widget.Battery(
                        format='{char} {percent:1.0%}',
                        low_foreground="#c33027",
                        charge_char='',
                        discharge_char='',
                        low_percentage=0.2,
                        update_delay=60,
                        fontsize=12,
                        font='TerminessTTF Nerd Font',
                        background="#ffffff",
                        padding=5,
                        foreground="#282828"
                        ),
                widget.TextBox(
                        "◤",
                        font='TerminessTTF Nerd Font',
                        fontsize=55,
                        foreground="#ffffff",
                        padding=-5,
                        ),
                widget.TextBox(
                        "◢",
                        font='TerminessTTF Nerd Font',
                        fontsize=55,
                        foreground="#ffffff",
                        padding=-2,
                        ),
                widget.TextBox(
                        " ",
                        background="#ffffff",
                        padding=0,
                        fontsize=15,
                        ),
                widget.Clock(
                        format='%a %d %b | %H:%M',
                        foreground="#282828",
                        font="TerminessTTF Nerd Font",
                        fontsize=12,
                        padding=0,
                        background="#ffffff",
                        ),
                widget.Sep(
                        linewidth = 1,
                        padding = 6,
                        foreground = colors[0],
                        background = colors[9]
                        ),
              ]
    return widgets_list

##### SCREENS ##### (TRIPLE MONITOR SETUP)

def init_widgets_screen1():
    widgets_screen1 = init_widgets_list()
    return widgets_screen1                       # Slicing removes unwanted widgets on Monitors 1,3

def init_widgets_screen2():
    widgets_screen2 = init_widgets_list()
    return widgets_screen2                       # Monitor 2 will display all widgets in widgets_list

def init_screens():
    return [Screen(top=bar.Bar(widgets=init_widgets_screen1(), opacity=0.95, size=25)),
            Screen(top=bar.Bar(widgets=init_widgets_screen2(), opacity=0.95, size=25)),
            Screen(top=bar.Bar(widgets=init_widgets_screen1(), opacity=0.95, size=25))]

##### FLOATING WINDOWS #####

@hook.subscribe.client_new
def floating(window):
    floating_types = ['notification', 'toolbar', 'splash', 'dialog']
    transient = window.window.get_wm_transient_for()
    if window.window.get_wm_type() in floating_types or transient:
        window.floating = True

def init_mouse():
    return [Drag([mod], "Button1", lazy.window.set_position_floating(),      # Move floating windows
                 start=lazy.window.get_position()),
            Drag([mod], "Button3", lazy.window.set_size_floating(),          # Resize floating windows
                 start=lazy.window.get_size()),
            Click([mod, "shift"], "Button1", lazy.window.bring_to_front())]  # Bring floating window to front

##### DEFINING A FEW THINGS #####

if __name__ in ["config", "__main__"]:
    mod = "mod4"                                         # Sets mod key to SUPER/WINDOWS
    myTerm = "st"                                    # My terminal of choice
    myConfig = "/home/ebony/.config/qtile/config.py"        # Qtile config file location

    colors = init_colors()
    keys = init_keys()
    mouse = init_mouse()
    group_names = init_group_names()
    groups = init_groups()
    floating_layout = init_floating_layout()
    layout_theme = init_layout_theme()
    border_args = init_border_args()
    layouts = init_layouts()
    screens = init_screens()
    widget_defaults = init_widgets_defaults()
    widgets_list = init_widgets_list()
    widgets_screen1 = init_widgets_screen1()
    widgets_screen2 = init_widgets_screen2()

##### SETS GROUPS KEYBINDINGS #####

for i, (name, kwargs) in enumerate(group_names, 1):
    keys.append(Key([mod], str(i), lazy.group[name].toscreen()))          # Switch to another group
    keys.append(Key([mod, "shift"], str(i), lazy.window.togroup(name)))   # Send current window to another group

##### STARTUP APPLICATIONS #####

@hook.subscribe.startup_once
def start_once():
    home = os.path.expanduser('~')
    subprocess.call([home + '/.config/qtile/autostart.sh'])

##### NEEDED FOR SOME JAVA APPS #####

#wmname = "LG3D"
wmname = "qtile"


