import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { LayoutDashboard, BookOpen, Calendar, Timer as TimerIcon, Brain, BarChart3, Clock } from 'lucide-react';

export function AppSidebar() {
  const location = useLocation();
  
  const menuItems = [
    { title: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { title: 'Subjects', icon: BookOpen, href: '/subjects' },
    { title: 'Schedule', icon: Calendar, href: '/schedule' },
    { title: 'Study Timer', icon: TimerIcon, href: '/timer' },
    { title: 'Quizzes', icon: Brain, href: '/quizzes' },
    { title: 'Analytics', icon: BarChart3, href: '/analytics' },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-lg">
            <Clock className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">TimeSlice</h1>
            <p className="text-xs text-muted-foreground">Plan • Study • Adapt</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.href}>
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
