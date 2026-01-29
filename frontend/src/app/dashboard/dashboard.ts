import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { fetchAuthSession, signOut } from 'aws-amplify/auth';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// --- MOCK DATA FOR BRAVESOUP PULSE ---
const MOCK_PULSE_DATA = {
  executive: {
    revenue: { total: '$24,502', net: '$21,005', growth: '12%', trend: 'up' },
    orders: { count: 843, aov: '$29.00', perDay: 28, growth: '8%', trend: 'up' },
    customers: { new: 612, returning: 231, storyMakerAdoption: '34%', growth: '4%', trend: 'up' },
    redFlags: { refunds: 5, chargebacks: 1, failedPayments: 3 }
  },
  salesMix: {
    nameBook: { count: 450, rev: '$13,500' },


    storyMaker: { count: 240, rev: '$8,400' }, // Higher tier
    addons: { count: 153, rev: '$2,602' },
    insights: [
      { label: 'StoryMaker Adoption', value: '34%' },
      { label: 'Upsell Conversion', value: '18%' },
      { label: 'Post-Purchase Credits', value: 'Yes (Growing)' }
    ]
  },
  funnel: {
    visitors: 12500,
    checkoutStarted: 3100,
    purchased: 843,
    abandoned: 2257,
    conversion: '6.7%'
  },
  trends: {
    revenuePoints: '0,100 20,80 40,90 60,50 80,40 100,20', // SVG polyline points (inverted Y for SVG)
    revenueLabels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
    traffic: [
      { label: 'Organic Search', percent: 45, color: '#4f46e5' },
      { label: 'Social Ads', percent: 35, color: '#06b6d4' },
      { label: 'Direct', percent: 20, color: '#f59e0b' }
    ],
    userGrowth: [35, 42, 58, 62, 75, 90], // Values 0-100 for height
    userGrowthLabels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
    devices: { desktop: 65, mobile: 25, tablet: 10 }
  },
  engagement: {
    booksCreated: 1024,
    newVersions: 312,
    cyaPaths: 89,
    aiNarrations: 56,
    manualRecordings: 12,
    saveSlotsUsed: '45%',
    creditsSpent: 420
  },
  alerts: [
    { level: 'critical', msg: '5 Chargebacks need review', action: 'Review' },
    { level: 'warn', msg: '12 Users have 0 save slots (Churn Risk)', action: 'View Users' },
    { level: 'info', msg: 'StoryMaker conversion dropped 2% this week', action: 'Check Pricing' },
    { level: 'critical', msg: 'Support Ticket #2991 flagged URGENT', action: 'Reply' }
  ]
};
const MOCK_VARIANTS = {
  '7d': {
    revenue: { total: '$8,450', net: '$7,100', growth: '12%', trend: 'up' },
    orders: { count: 215, aov: '$39.20', perDay: 30, growth: '5%', trend: 'up' },
    customers: { new: 85, returning: 42, storyMakerAdoption: '35%', growth: '12%', trend: 'up' },
    redFlags: { refunds: 2, chargebacks: 1, failedPayments: 3 },
    engagement: { booksCreated: 320, newVersions: 98, cyaPaths: 25, aiNarrations: 18, manualRecordings: 5, saveSlotsUsed: '46%', creditsSpent: 150 }
  },
  '30d': {
    revenue: { total: '$24,502', net: '$21,005', growth: '8%', trend: 'up' },
    orders: { count: 843, aov: '$29.00', perDay: 28, growth: '3%', trend: 'down' },
    customers: { new: 612, returning: 231, storyMakerAdoption: '34%', growth: '2%', trend: 'neutral' },
    redFlags: { refunds: 5, chargebacks: 1, failedPayments: 3 },
    engagement: { booksCreated: 1024, newVersions: 312, cyaPaths: 89, aiNarrations: 56, manualRecordings: 12, saveSlotsUsed: '45%', creditsSpent: 420 }
  },
  '90d': {
    revenue: { total: '$68,900', net: '$59,100', growth: '15%', trend: 'up' },
    orders: { count: 2450, aov: '$28.50', perDay: 27, growth: '6%', trend: 'up' },
    customers: { new: 1850, returning: 640, storyMakerAdoption: '38%', growth: '5%', trend: 'up' },
    redFlags: { refunds: 12, chargebacks: 4, failedPayments: 8 },
    engagement: { booksCreated: 2900, newVersions: 850, cyaPaths: 240, aiNarrations: 150, manualRecordings: 45, saveSlotsUsed: '52%', creditsSpent: 1100 }
  }
};

const REAL_NAMES = [
  'Alice Johnson', 'Bob Smith', 'Charlie Davis', 'Diana Evans',
  'Ethan Harris', 'Fiona Clark', 'George Baker', 'Hannah Lewis',
  'Ian Walker', 'Jane Doe', 'Kevin White', 'Laura Green'
];

const MOCK_CUSTOMERS = REAL_NAMES.map((name, i) => ({
  id: `cust_${i + 100}`,
  name: name,
  email: `${name.split(' ')[0].toLowerCase()}.${name.split(' ')[1].toLowerCase()}@example.com`,
  role: i % 4 === 0 ? 'Premium' : 'Standard',
  joined: new Date(2023, i, 15).toLocaleDateString(),
  credits: (i * 15) + 5,
  childProfileCount: Math.floor(Math.random() * 3) + 1,
  avatar: name.charAt(0),
  books: [
    { title: 'The Lost World', type: 'Adventure', created: '2023-11-01', length: '4h 12m' },
    { title: 'My Memoirs', type: 'Name', created: '2024-01-15', length: '6h 30m' },
    ...(i % 2 === 0 ? [{ title: 'Bedtime Stories', type: 'Adventure', created: '2024-02-10', length: '20m' }] : [])
  ],
  voices: [
    { name: i % 2 === 0 ? 'Siri' : 'Alexa', type: 'AI Voice' },
    ...(i % 3 === 0 ? [{ name: 'Grandma', type: 'Clone' }] : [])
  ],
  transactions: [
    { date: '2024-01-15', desc: 'Gift Card', amount: '$49.00' },
    { date: '2023-12-10', desc: 'Gift Card', amount: '$12.00' }
  ]
}));

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    user: 'Terry Franci',
    avatar: 'https://i.pravatar.cc/150?u=1',
    msg: 'requests permission to change Project - Nganter App',
    project: 'Project',
    time: '5 min ago',
    unread: true
  },
  {
    id: 2,
    user: 'Alena Franci',
    avatar: 'https://i.pravatar.cc/150?u=2',
    msg: 'requests permission to change Project - Nganter App',
    project: 'Project',
    time: '8 min ago',
    unread: true
  },
  {
    id: 3,
    user: 'Jocelyn Kenter',
    avatar: 'https://i.pravatar.cc/150?u=3',
    msg: 'requests permission to change Project - Nganter App',
    project: 'Project',
    time: '15 min ago',
    unread: false
  },
  {
    id: 4,
    user: 'Brandon Philips',
    avatar: 'https://i.pravatar.cc/150?u=4',
    msg: 'requests permission to change Project - Nganter App',
    project: 'Project',
    time: '1 hr ago',
    unread: false
  }
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-layout">
      <!-- SIDEBAR (Fixed) -->
      <aside class="sidebar">
          <div class="sidebar-header">
             <div class="logo">Brave<span>Soup</span></div>
          </div>
          <nav class="sidebar-nav">
             <!-- INTERNAL VIEW -->
             <ng-container *ngIf="isInternal">
                 <div class="nav-label">Main</div>
                 <a (click)="view = 'PULSE'" [class.active]="view === 'PULSE'" class="nav-item">
                     <span class="icon">�</span> Dashboard
                 </a>
                 <div class="nav-label mt-4">Management</div>
                 <a (click)="loadUsers()" [class.active]="view === 'USERS'" class="nav-item">
                     <span class="icon">👥</span> User Manager
                 </a>
                 <a (click)="view = 'CUSTOMERS'; selectedCustomer = null" [class.active]="view === 'CUSTOMERS' || view === 'CUSTOMER_DETAIL'" class="nav-item">
                     <span class="icon">😊</span> Customers
                 </a>
                 <a (click)="view = 'ALERTS'" [class.active]="view === 'ALERTS'" class="nav-item">
                     <span class="icon">🔔</span> Alerts <span class="badge-count" *ngIf="pulse.alerts.length">{{pulse.alerts.length}}</span>
                 </a>
             </ng-container>

             <!-- CONSUMER VIEW -->
             <div class="nav-label mt-4">My Account</div>
             <a *ngIf="!isInternal" (click)="view = 'BOOKS'" [class.active]="view === 'BOOKS'" class="nav-item">
                 <span class="icon">📚</span> My Library
             </a>
             <a (click)="view = 'PROFILE'" [class.active]="view === 'PROFILE'" class="nav-item">
                 <span class="icon">👤</span> Profile
             </a>
          </nav>
          <div class="sidebar-footer">
             <button (click)="onLogout()" class="logout-btn"><span>🚪</span> Sign Out</button>
             <div class="user-info">{{ userEmail }}</div>
          </div>
      </aside>

      <!-- MAIN AREA -->
      <main class="main-content">
          <header class="top-header">
              <div class="header-left">
                  <h1>{{ getTitle() }}</h1>
                  <span *ngIf="loading" class="loading-badge">Syncing...</span>
              </div>
              <div class="header-right">
                 <button class="icon-btn" (click)="toggleTheme()" title="Toggle Theme">
                    <svg *ngIf="!isDarkMode" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="svg-icon">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                    </svg>
                    <svg *ngIf="isDarkMode" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="svg-icon">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                    </svg>
                 </button>
                 <div class="notification-wrapper">
                     <button class="icon-btn relative" (click)="showNotifications = !showNotifications; showProfileMenu = false" title="Notifications">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="svg-icon">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                        </svg>
                        <span class="badge-dot" *ngIf="hasUnreadNotifications()"></span>
                     </button>
                     
                     <!-- NOTIFICATION DROPDOWN -->
                     <div class="notification-popup" *ngIf="showNotifications">
                         <div class="notif-header">
                             <h3>Notifications</h3>
                             <button class="close-btn" (click)="showNotifications = false">✕</button>
                         </div>
                         <div class="notif-list">
                             <div class="notif-item" *ngFor="let n of notifications">
                                 <div class="notif-avatar">
                                     <img [src]="n.avatar" alt="User">
                                     <div class="status-dot" *ngIf="n.unread"></div>
                                 </div>
                                 <div class="notif-content">
                                     <p class="notif-text"><strong>{{ n.user }}</strong> {{ n.msg }}</p>
                                     <div class="notif-meta">
                                         <span class="project-tag">{{ n.project }}</span>
                                         <span class="time-dot">•</span>
                                         <span class="time-ago">{{ n.time }}</span>
                                     </div>
                                 </div>
                             </div>
                         </div>
                         <div class="notif-footer">
                             <button class="view-all-btn">View All Notifications</button>
                         </div>
                     </div>
                 </div>
                 
                 <div class="profile-section">
                     <div class="profile-trigger" (click)="showProfileMenu = !showProfileMenu; showNotifications = false">
                        <div class="avatar-circle">{{ userEmail.charAt(0).toUpperCase() }}</div>
                        <span class="user-name-display">{{ userEmail.split('@')[0] }}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="svg-icon-sm">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                     </div>

                     <!-- DROPDOWN MENU -->
                     <div class="profile-dropdown" *ngIf="showProfileMenu">
                         <div class="dropdown-header-info">
                             <div class="dd-name">{{ userEmail.split('@')[0] }}</div>
                             <div class="dd-email">{{ userEmail }}</div>
                         </div>
                         <div class="dropdown-list">
                             <div class="dd-item" (click)="view = 'PROFILE'; showProfileMenu = false">
                                 <span class="dd-icon">👤</span> Edit profile
                             </div>
                             <div class="dd-item">
                                 <span class="dd-icon">⚙️</span> Account settings
                             </div>

                             <div class="dd-divider"></div>
                             <div class="dd-item" (click)="onLogout()">
                                 <span class="dd-icon">⬅️</span> Sign out
                             </div>
                         </div>
                     </div>
                 </div>
              </div>
          </header>

          <div class="content-scroll">

              <!-- ========================================== -->
              <!-- VIEW: EXECUTIVE PULSE (The "Mega Dashboard") -->
              <!-- ========================================== -->
              <div *ngIf="view === 'PULSE' && isInternal" class="dashboard-grid fade-in">
                  
                  <!-- SECTION 1: EXECUTIVE SNAPSHOT (Top Row) -->
                  <div class="section-container full-width">
                      <div class="section-header">
                          <h2>Executive Snapshot</h2>
                          <div class="range-toolbar">
                              <div class="range-group">
                                  <button class="range-btn" (click)="selectTimeRange('7d')" [class.active]="timeRange === '7d'">7 Days</button>
                                  <button class="range-btn" (click)="selectTimeRange('30d')" [class.active]="timeRange === '30d'">30 Days</button>
                                  <button class="range-btn" (click)="selectTimeRange('90d')" [class.active]="timeRange === '90d'">90 Days</button>
                              </div>
                             <div class="date-picker-trigger relative" (click)="showCalendar = !showCalendar">
                                 <span class="calendar-icon">📅</span>
                                 <span>Jan 21 to Jan 27</span>
                                 <div class="calendar-popup" *ngIf="showCalendar" (click)="$event.stopPropagation()">
                                     <div class="cal-header">
                                         <button class="cal-nav">&lt;</button>
                                         <span>January 2026</span>
                                         <button class="cal-nav">&gt;</button>
                                     </div>
                                     <div class="cal-grid">
                                         <div class="cal-day-head">Sun</div><div class="cal-day-head">Mon</div><div class="cal-day-head">Tue</div><div class="cal-day-head">Wed</div><div class="cal-day-head">Thu</div><div class="cal-day-head">Fri</div><div class="cal-day-head">Sat</div>
                                         
                                         <!-- Mock Days -->
                                         <div class="cal-day dim">28</div><div class="cal-day dim">29</div><div class="cal-day dim">30</div>
                                         <div class="cal-day">1</div><div class="cal-day">2</div><div class="cal-day">3</div><div class="cal-day">4</div>
                                         <div class="cal-day">5</div><div class="cal-day">6</div><div class="cal-day">7</div><div class="cal-day">8</div><div class="cal-day">9</div><div class="cal-day">10</div><div class="cal-day">11</div>
                                         <div class="cal-day">12</div><div class="cal-day">13</div><div class="cal-day">14</div><div class="cal-day">15</div><div class="cal-day">16</div><div class="cal-day">17</div><div class="cal-day">18</div>
                                         <div class="cal-day">19</div><div class="cal-day">20</div><div class="cal-day range-start">21</div><div class="cal-day range-mid">22</div><div class="cal-day range-mid">23</div><div class="cal-day range-mid">24</div><div class="cal-day range-mid">25</div>
                                         <div class="cal-day range-mid">26</div><div class="cal-day range-end">27</div><div class="cal-day">28</div><div class="cal-day">29</div><div class="cal-day">30</div><div class="cal-day">31</div>
                                     </div>
                                     <div class="cal-footer">
                                         <button class="btn-clean small" (click)="showCalendar = false">Cancel</button>
                                         <button class="btn-primary small" (click)="showCalendar = false">Apply</button>
                                     </div>
                                 </div>
                             </div>
                          </div>
                      </div>
                      <div class="snapshot-grid">
                          <!-- Revenue -->
                          <div class="kpi-card" *ngIf="role !== 'MARKETING'">
                              <div class="kpi-label">Gross Revenue</div>
                              <div class="kpi-value">{{ pulse.executive.revenue.total }}</div>
                              <div class="kpi-sub">Net (post-fees): {{ pulse.executive.revenue.net }}</div>
                              <div class="trend" [ngClass]="pulse.executive.revenue.trend">
                                  <svg *ngIf="pulse.executive.revenue.trend === 'up'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="trend-icon">
                                    <path fill-rule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clip-rule="evenodd" />
                                  </svg>
                                  <svg *ngIf="pulse.executive.revenue.trend === 'down'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="trend-icon">
                                    <path fill-rule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z" clip-rule="evenodd" />
                                  </svg>
                                  {{ pulse.executive.revenue.growth }}
                              </div>
                          </div>
                          <div class="kpi-card" *ngIf="role === 'MARKETING'">
                              <div class="kpi-label">Revenue</div>
                              <div class="kpi-value text-blur">HIDDEN</div>
                              <div class="kpi-sub">View Restricted</div>
                          </div>
                          <!-- Orders -->
                          <div class="kpi-card">
                              <div class="kpi-label">Total Orders</div>
                              <div class="kpi-value">{{ pulse.executive.orders.count }}</div>
                              <div class="kpi-sub">AOV: {{ pulse.executive.orders.aov }}</div>
                              <div class="trend" [ngClass]="pulse.executive.orders.trend">
                                  <svg *ngIf="pulse.executive.orders.trend === 'up'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="trend-icon">
                                    <path fill-rule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clip-rule="evenodd" />
                                  </svg>
                                  <svg *ngIf="pulse.executive.orders.trend === 'down'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="trend-icon">
                                    <path fill-rule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z" clip-rule="evenodd" />
                                  </svg>
                                  {{ pulse.executive.orders.growth }}
                              </div>
                          </div>
                          <!-- Customers -->
                          <div class="kpi-card">
                              <div class="kpi-label">StoryMaker Adoption</div>
                              <div class="kpi-value">{{ pulse.executive.customers.storyMakerAdoption }}</div>
                              <div class="kpi-sub">{{ pulse.executive.customers.new }} New Customers</div>
                              <div class="trend" [ngClass]="pulse.executive.customers.trend">
                                  <svg *ngIf="pulse.executive.customers.trend === 'up'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="trend-icon">
                                    <path fill-rule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clip-rule="evenodd" />
                                  </svg>
                                  <svg *ngIf="pulse.executive.customers.trend === 'down'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="trend-icon">
                                    <path fill-rule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z" clip-rule="evenodd" />
                                  </svg>
                                  {{ pulse.executive.customers.growth }}
                              </div>
                          </div>
                          <!-- Red Flags -->
                          <div class="kpi-card danger-border">
                              <div class="kpi-label text-red">Red Flags (24h)</div>
                              <div class="red-flag-row">
                                  <span>Refunds:</span> <b>{{ pulse.executive.redFlags.refunds }}</b>
                              </div>
                              <div class="red-flag-row">
                                  <span>Chargebacks:</span> <b>{{ pulse.executive.redFlags.chargebacks }}</b>
                              </div>
                              <div class="red-flag-row">
                                  <span>Failed Pay:</span> <b>{{ pulse.executive.redFlags.failedPayments }}</b>
                              </div>
                          </div>
                      </div>
                  </div>

                  <!-- SECTION 2: SALES & PRODUCT MIX -->
                  <div class="section-container">
                      <div class="section-header">
                          <h2>Sales & Product Mix</h2>
                          <div class="range-toolbar mini">
                               <div class="range-group">
                                   <button class="range-btn" (click)="selectTimeRange('7d')" [class.active]="timeRange === '7d'">7d</button>
                                   <button class="range-btn" (click)="selectTimeRange('30d')" [class.active]="timeRange === '30d'">30d</button>
                                   <button class="range-btn" (click)="selectTimeRange('90d')" [class.active]="timeRange === '90d'">90d</button>
                               </div>
                          </div>
                      </div>
                      <div class="mix-content">
                          <div class="mix-row">
                              <span class="mix-name">Name Book (T1)</span>
                              <div class="mix-bar-container">
                                  <div class="mix-bar" style="width: 60%"></div>
                              </div>
                              <span class="mix-val">{{ pulse.salesMix.nameBook.count }}</span>
                              <span class="mix-rev">{{ pulse.salesMix.nameBook.rev }}</span>
                          </div>
                          <div class="mix-row">
                              <span class="mix-name highlight">StoryMaker (T2)</span>
                              <div class="mix-bar-container">
                                  <div class="mix-bar highlight" style="width: 34%"></div>
                              </div>
                              <span class="mix-val">{{ pulse.salesMix.storyMaker.count }}</span>
                              <span class="mix-rev">{{ pulse.salesMix.storyMaker.rev }}</span>
                          </div>
                          <div class="mix-row">
                              <span class="mix-name">Add-ons</span>
                              <div class="mix-bar-container">
                                  <div class="mix-bar addon" style="width: 20%"></div>
                              </div>
                              <span class="mix-val">{{ pulse.salesMix.addons.count }}</span>
                              <span class="mix-rev">{{ pulse.salesMix.addons.rev }}</span>
                          </div>

                          <div class="insight-box mt-4">
                              <div class="insight-item" *ngFor="let i of pulse.salesMix.insights">
                                  <span class="label">{{ i.label }}</span>
                                  <span class="val">{{ i.value }}</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  <!-- SECTION 3: FUNNEL HEALTH -->
                  <div class="section-container">
                      <div class="section-header">
                          <h2>Funnel Health</h2>
                          <div class="range-toolbar mini">
                               <div class="range-group">
                                   <button class="range-btn" (click)="selectTimeRange('7d')" [class.active]="timeRange === '7d'">7d</button>
                                   <button class="range-btn" (click)="selectTimeRange('30d')" [class.active]="timeRange === '30d'">30d</button>
                                   <button class="range-btn" (click)="selectTimeRange('90d')" [class.active]="timeRange === '90d'">90d</button>
                               </div>
                          </div>
                      </div>
                      <div class="funnel-viz">
                          <div class="funnel-step">
                              <div class="step-box wide">Visitors: {{ pulse.funnel.visitors }}</div>
                          </div>
                          <div class="funnel-connector">↓</div>
                          <div class="funnel-step">
                              <div class="step-box medium">Checkout: {{ pulse.funnel.checkoutStarted }}</div>
                              <div class="abandon-stat">Abandoned: {{ pulse.funnel.abandoned }}</div>
                          </div>
                          <div class="funnel-connector">↓</div>
                          <div class="funnel-step">
                              <div class="step-box narrow success">Purchased: {{ pulse.funnel.purchased }}</div>
                          </div>
                          <div class="conversion-rate">
                              Overall Conversion: <strong>{{ pulse.funnel.conversion }}</strong>
                          </div>
                      </div>
                  </div>

                  <!-- NOVELTY: GROWTH TRENDS (NEW GRAPHS) -->
                  <div class="section-container full-width">
                      <div class="section-header">
                          <h2>Growth Trends</h2>
                          <div class="range-toolbar mini">
                               <div class="range-group">
                                   <button class="range-btn" (click)="selectTimeRange('7d')" [class.active]="timeRange === '7d'">7d</button>
                                   <button class="range-btn" (click)="selectTimeRange('30d')" [class.active]="timeRange === '30d'">30d</button>
                                   <button class="range-btn" (click)="selectTimeRange('90d')" [class.active]="timeRange === '90d'">90d</button>
                               </div>
                          </div>
                      </div>
                      <div class="graphs-row">
                          
                          <!-- SVG Line Chart -->
                          <div class="graph-box">
                              <h3>Monthly Revenue (6mo)</h3>
                              <div class="svg-chart-container">
                                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="line-chart">
                                      <!-- Grid lines -->
                                      <line x1="0" y1="20" x2="100" y2="20" stroke="#e5e7eb" stroke-width="0.5" />
                                      <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" stroke-width="0.5" />
                                      <line x1="0" y1="80" x2="100" y2="80" stroke="#e5e7eb" stroke-width="0.5" />
                                      
                                      <!-- The Line -->
                                      <polyline [attr.points]="pulse.trends.revenuePoints" 
                                                fill="none" 
                                                stroke="#4f46e5" 
                                                stroke-width="2" 
                                                stroke-linecap="round" 
                                                vector-effect="non-scaling-stroke" />
                                                
                                      <!-- Area under line (optional, for aesthetics) -->
                                      <polygon points="0,100 0,100 20,80 40,90 60,50 80,40 100,20 100,100" fill="url(#grad)" opacity="0.2" />
                                      
                                      <defs>
                                        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                          <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
                                          <stop offset="100%" style="stop-color:#4f46e5;stop-opacity:0" />
                                        </linearGradient>
                                      </defs>
                                  </svg>
                                  <div class="chart-labels">
                                      <span *ngFor="let m of pulse.trends.revenueLabels">{{ m }}</span>
                                  </div>
                              </div>
                          </div>

                          <!-- CSS Pie Chart -->
                          <div class="graph-box">
                               <h3>Traffic Sources</h3>
                               <div class="pie-layout">
                                   <!-- Conic Gradient Pie -->
                                   <div class="pie-chart" 
                                        style="background: conic-gradient(
                                            #4f46e5 0% 45%, 
                                            #06b6d4 45% 80%, 
                                            #f59e0b 80% 100%
                                        )">
                                   </div>
                                   <div class="pie-legend">
                                       <div class="legend-item" *ngFor="let t of pulse.trends.traffic">
                                           <span class="dot" [style.background]="t.color"></span>
                                           <span>{{t.label}} ({{t.percent}}%)</span>
                                       </div>
                                   </div>
                               </div>
                          </div>
                      </div>
                  </div>

                  <div class="section-container full-width">
                      <div class="section-header">
                          <h2>Additional Metrics</h2>
                          <div class="range-toolbar mini">
                               <div class="range-group">
                                   <button class="range-btn" (click)="selectTimeRange('7d')" [class.active]="timeRange === '7d'">7d</button>
                                   <button class="range-btn" (click)="selectTimeRange('30d')" [class.active]="timeRange === '30d'">30d</button>
                                   <button class="range-btn" (click)="selectTimeRange('90d')" [class.active]="timeRange === '90d'">90d</button>
                               </div>
                          </div>
                      </div>
                      <div class="graphs-row">
                          <!-- Bar Chart: User Growth -->
                          <div class="graph-box">
                              <h3>User Growth (New Signups)</h3>
                              <div class="bar-chart-container">
                                  <div class="bar-group" *ngFor="let h of pulse.trends.userGrowth; let i = index">
                                      <div class="bar-val" [style.height.%]="h"></div>
                                      <span class="bar-label">{{ pulse.trends.userGrowthLabels[i] }}</span>
                                  </div>
                              </div>
                          </div>

                          <!-- Horizontal Stack: Device Usage -->
                          <div class="graph-box">
                              <h3>Device Breakdown</h3>
                              <div class="device-stats">
                                  <div class="device-row">
                                      <span class="dev-icon">💻</span>
                                      <span class="dev-name">Desktop</span>
                                      <div class="dev-bar-bg"><div class="dev-bar" [style.width.%]="pulse.trends.devices.desktop"></div></div>
                                      <span class="dev-pct">{{pulse.trends.devices.desktop}}%</span>
                                  </div>
                                  <div class="device-row">
                                      <span class="dev-icon">📱</span>
                                      <span class="dev-name">Mobile</span>
                                      <div class="dev-bar-bg"><div class="dev-bar" [style.width.%]="pulse.trends.devices.mobile" style="background: #ec4899"></div></div>
                                      <span class="dev-pct">{{pulse.trends.devices.mobile}}%</span>
                                  </div>
                                  <div class="device-row">
                                      <span class="dev-icon">📟</span>
                                      <span class="dev-name">Tablet</span>
                                      <div class="dev-bar-bg"><div class="dev-bar" [style.width.%]="pulse.trends.devices.tablet" style="background: #8b5cf6"></div></div>
                                      <span class="dev-pct">{{pulse.trends.devices.tablet}}%</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  <!-- SECTION 4: ENGAGEMENT (Churn Watch) -->
                  <div class="section-container">
                      <div class="section-header">
                          <h2>Customer Activity & Engagement</h2>
                          <div class="range-toolbar mini">
                               <div class="range-group">
                                   <button class="range-btn" (click)="selectTimeRange('7d')" [class.active]="timeRange === '7d'">7d</button>
                                   <button class="range-btn" (click)="selectTimeRange('30d')" [class.active]="timeRange === '30d'">30d</button>
                                   <button class="range-btn" (click)="selectTimeRange('90d')" [class.active]="timeRange === '90d'">90d</button>
                               </div>
                          </div>
                      </div>
                      <div class="engagement-grid">
                          <div class="eng-item">
                              <span class="eng-val">{{ pulse.engagement.booksCreated }}</span>
                              <span class="eng-label">Books Created</span>
                          </div>
                          <div class="eng-item">
                              <span class="eng-val">{{ pulse.engagement.newVersions }}</span>
                              <span class="eng-label">Versions Created</span>
                          </div>
                          <div class="eng-item">
                              <span class="eng-val">{{ pulse.engagement.cyaPaths }}</span>
                              <span class="eng-label">CYA Paths</span>
                          </div>
                          <div class="eng-item">
                              <span class="eng-val">{{ pulse.engagement.aiNarrations }}</span>
                              <span class="eng-label">AI Narrations</span>
                          </div>
                          <div class="eng-item">
                              <span class="eng-val">{{ pulse.engagement.manualRecordings }}</span>
                              <span class="eng-label">Manual Voice</span>
                          </div>
                          <div class="eng-item">
                              <span class="eng-val">{{ pulse.engagement.saveSlotsUsed }}</span>
                              <span class="eng-label">Slot Usage</span>
                          </div>
                          <div class="eng-item">
                              <span class="eng-val">{{ pulse.engagement.creditsSpent }}</span>
                              <span class="eng-label">Credits Spent</span>
                          </div>
                      </div>
                      <div class="alert-banner warn mt-4">
                          ⚠️ Narration usage is low. Need better onboarding?
                      </div>
                  </div>

                  <!-- SECTION 5: ALERTS -->
                  <div class="section-container">
                      <div class="section-header"><h2>Founder Alerts</h2></div>
                      <div class="alerts-list">
                          <div class="alert-item" *ngFor="let alert of pulse.alerts" [ngClass]="alert.level">
                              <div class="alert-content">
                                  <span class="alert-icon" [ngSwitch]="alert.level">
                                      <span *ngSwitchCase="'critical'">🔥</span>
                                      <span *ngSwitchCase="'warn'">⚠️</span>
                                      <span *ngSwitchDefault>ℹ️</span>
                                  </span>
                                  <span class="alert-msg">{{ alert.msg }}</span>
                              </div>
                              <button class="action-btn">{{ alert.action }}</button>
                          </div>
                      </div>
                  </div>

              </div>

              <!-- ========================================== -->
              <!-- VIEW: USER MANAGER (Functional) -->
              <!-- ========================================== -->
              <!-- ========================================== -->
              <!-- VIEW: USER MANAGER (Functional - RESTORED) -->
              <!-- ========================================== -->
              <div *ngIf="view === 'USERS' && isInternal" class="view-container fade-in">
                  <div class="section-container full-width">
                      <div class="section-header">
                          <h2>System Users</h2>
                          <button (click)="loadUsers()" class="btn-clean">↻ Refresh</button>
                       </div>
                       <table class="data-table user-layout">
                          <thead>
                             <tr>
                                 <th>User</th>
                                 <th class="text-center">Role</th>
                                 <th class="text-right">Actions</th>
                             </tr>
                          </thead>
                          <tbody>
                              <tr *ngFor="let user of users" class="user-row">
                                 <td>
                                     <div class="font-bold text-main">{{ user.email }}</div>
                                 </td>
                                 <td class="text-center">
                                     <div class="role-selector-wrapper">
                                         <select [ngModel]="user.role" (ngModelChange)="updateRole(user, $event)" class="role-select-badge" [ngClass]="user.role">
                                             <option value="USER">User</option>
                                             <option value="SUPER_ADMIN">Super Admin</option>
                                             <option value="FINANCE_ADMIN">Finance Admin</option>
                                             <option value="OPS_ADMIN">Ops Admin</option>
                                             <option value="DEVELOPER">Developer</option>
                                             <option value="SUPPORT">Support</option>
                                             <option value="MARKETING">Marketing</option>
                                         </select>
                                         <span class="chevron-down-xs">▼</span>
                                     </div>
                                 </td>
                                 <td class="text-right">
                                    <button *ngIf="user.role !== 'SUPER_ADMIN' && user.email !== 'chappabharath1999@gmail.com'" (click)="deleteUser(user)" class="icon-btn-sm danger" title="Delete User">
                                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="svg-icon-xs">
                                         <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                       </svg>
                                    </button>
                                 </td>
                              </tr>
                          </tbody>
                       </table>
                  </div>
              </div>

              <!-- ========================================== -->
              <!-- VIEW: CUSTOMERS LIST (Mock Data) -->
              <!-- ========================================== -->
              <div *ngIf="view === 'CUSTOMERS' && isInternal" class="view-container fade-in">
                  <div class="section-container full-width">
                      <div class="section-header">
                          <h2>Customer Directory</h2>
                          <input type="text" placeholder="Search..." class="search-box">
                      </div>
                      <table class="data-table customer-layout hover-rows">
                          <thead>
                             <tr>
                                 <th style="width: 50px; text-align: center;">#</th>
                                 <th>Customer</th>
                                 <th>Joined</th>
                                 <th>Total Books</th>
                                 <th>Credits</th>
                                 <th>Child Profile</th>
                                 <th></th>
                             </tr>
                          </thead>
                         <tbody>
                            <tr *ngFor="let cust of mockCustomers; let i = index" (click)="openCustomer(cust)" style="cursor: pointer">
                               <td style="text-align: center;"><span class="text-gray font-bold">{{ i + 1 }}</span></td>
                               <td>
                                   <div class="user-cell">
                                       <div class="avatar-sm">{{ cust.avatar }}</div>
                                       <div>
                                           <div class="font-bold">{{ cust.name }}</div>
                                           <small class="text-gray">{{ cust.email }}</small>
                                       </div>
                                   </div>
                               </td>
                               <td>{{ cust.joined }}</td>
                               <td>{{ cust.books.length }}</td>
                               <td>{{ cust.credits }}</td>
                                <td>{{ cust.childProfileCount }} {{ cust.childProfileCount === 1 ? 'Profile' : 'Profiles' }}</td>
                                <td>
                                    <button class="icon-btn-sm" (click)="$event.stopPropagation(); openCustomer(cust)" title="Edit Customer">
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="svg-icon-xs">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                      </svg>
                                    </button>
                                </td>
                            </tr>
                         </tbody>
                      </table>
                  </div>
              </div>

              <!-- ========================================== -->
              <!-- VIEW: CUSTOMER DETAIL (Drill-down) -->
              <!-- ========================================== -->
              <div *ngIf="view === 'CUSTOMER_DETAIL' && selectedCustomer" class="view-container fade-in">
                  <button (click)="view = 'CUSTOMERS'" class="btn-clean mb-4">← Back to List</button>
                  
                  <!-- Profile Header -->
                  <div class="section-container full-width mb-4">
                      <div class="profile-header">
                          <div class="avatar-lg">{{ selectedCustomer.avatar }}</div>
                          <div class="profile-info">
                              <h2>{{ selectedCustomer.name }}</h2>
                              <p>{{ selectedCustomer.email }}</p>
                          </div>
                          <div class="profile-stats">
                              <div class="stat-box"><h3>{{ selectedCustomer.credits }}</h3><span>Credits</span></div>
                              <div class="stat-box"><h3>{{ selectedCustomer.books.length }}</h3><span>Books</span></div>
                          </div>
                      </div>
                  </div>

                  <div class="dashboard-grid">
                      <!-- Books Table -->
                      <div class="section-container full-width">

                          <div class="section-header">
                            <h2 class="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 24px; height: 24px;">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                </svg>
                                Books & Adventures
                            </h2>
                          </div>
                          <table class="data-table">
                              <thead><tr><th>Title</th><th>Type</th><th>Created</th></tr></thead>
                              <tbody>
                                  <tr *ngFor="let b of selectedCustomer.books">
                                      <td class="font-bold">{{ b.title }}</td>
                                      <td><span class="tag">{{ b.type }}</span></td>
                                      <td>{{ b.created }}</td>
                                  </tr>
                              </tbody>
                          </table>
                      </div>

                      <!-- Voices Table -->
                      <div class="section-container">
                          <div class="section-header">
                            <h2 class="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 24px; height: 24px;">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                                </svg>
                                Voices
                            </h2>
                          </div>
                          <table class="data-table">
                              <thead><tr><th>Name</th><th>Type</th></tr></thead>
                              <tbody>
                                  <tr *ngFor="let v of selectedCustomer.voices">
                                      <td class="font-bold">{{ v.name }}</td>
                                      <td>{{ v.type }}</td>
                                  </tr>
                              </tbody>
                          </table>
                      </div>

                      <!-- Credits/Transactions Table -->
                      <div class="section-container">
                          <div class="section-header">
                              <h2 class="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 24px; height: 24px;">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                                </svg>
                                Credit History
                              </h2>
                          </div>
                          <table class="data-table">
                              <thead><tr><th>Date</th><th>Desc</th><th class="text-right">Amount</th></tr></thead>
                              <tbody>
                                  <tr *ngFor="let t of selectedCustomer.transactions">
                                      <td>{{ t.date }}</td>
                                      <td>{{ t.desc }}</td>
                                      <td class="text-right font-bold">{{ t.amount }}</td>
                                  </tr>
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>

              <!-- ========================================== -->
              <!-- VIEW: MY LIBRARY (Consumer) -->
              <!-- ========================================== -->
              <div *ngIf="view === 'BOOKS'" class="view-container fade-in">
                  <div class="section-container full-width">
                      <div class="empty-state">
                           <div class="big-icon">📚</div>
                           <h2>My Library</h2>
                           <p>You have 0 books. Create one to get started!</p>
                           <button class="btn-primary">Create Book</button>
                      </div>
                  </div>
              </div>

              <!-- VIEW: PROFILE -->
              <div *ngIf="view === 'PROFILE'" class="view-container fade-in">
                  <div class="section-container">
                      <h2>My Profile</h2>
                      <div class="prop-row"><label>Email</label><span>{{ userEmail }}</span></div>
                      <div class="prop-row"><label>Role</label><span>{{ role }}</span></div>
                      <div class="prop-row"><label>ID</label><span class="mono">{{ userId }}</span></div>
                  </div>
              </div>

          </div>
      </main>
      <!-- CUSTOM MODAL -->
      <div class="modal-overlay" *ngIf="showModal" (click)="onModalCancel()">
          <div class="modal-box" (click)="$event.stopPropagation()">
              <span class="modal-icon">
                  {{ modalTitle.includes('Error') || modalTitle.includes('Denied') || modalTitle.includes('Delete') ? '⚠️' : '✅' }}
              </span>
              <div class="modal-title">{{ modalTitle }}</div>
              <div class="modal-text">{{ modalMessage }}</div>
              
              <div class="modal-actions">
                  <button *ngIf="modalType === 'CONFIRM'" class="modal-btn cancel-btn" (click)="onModalCancel()">Cancel</button>
                  <button class="modal-btn" [class.danger-btn]="modalTitle.includes('Delete')" (click)="onModalConfirm()">
                      {{ modalType === 'CONFIRM' ? modalConfirmLabel : 'OK' }}
                  </button>
              </div>
          </div>
      </div>

    </div>
  `,
  styles: [`
    /* GLOBAL RESET & VARIABLES */
    :host { 
        display: block; 
        height: 100vh; 
        overflow: hidden; 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        
        /* Light Theme (Default) */
        --bg-app: #f3f4f6;
        --bg-sidebar: #ffffff;
        --bg-card: #ffffff;
        --text-main: #111827;
        --text-muted: #6b7280;
        --border-color: #e5e7eb;
        --hover-bg: #f9fafb;
        --primary: #4f46e5;
        --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        
        font-weight: 500; /* Increased global weight */
    }
    
    :host.dark-theme {
        /* Dark Theme Overrides */
        --bg-app: #0f172a;
        --bg-sidebar: #1e293b;
        --bg-card: #1e293b;
        --text-main: #f8fafc;
        --text-muted: #94a3b8;
        --border-color: #334155;
        --hover-bg: #334155;
        --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
        --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
    }

    :host { color: var(--text-main); background: var(--bg-app); transition: background 0.3s ease, color 0.3s ease; }
    * { box-sizing: border-box; }

    /* LAYOUT GRID */
    .app-layout { display: flex; height: 100%; }
    /* LAYOUT GRID */
    .app-layout { display: flex; height: 100%; }
    .sidebar { width: 280px; background: var(--bg-sidebar); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; flex-shrink: 0; transition: background 0.3s, border-color 0.3s; }
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
    .content-scroll { flex: 1; overflow-y: auto; padding: 24px; background: var(--bg-app); }
    
    /* DASHBOARD GRID SYSTEM */
    .dashboard-grid { 
        display: grid; 
        grid-template-columns: repeat(2, 1fr); 
        gap: 24px; 
        max-width: 1400px; 
        margin: 0 auto; 
    }
    .full-width { grid-column: span 2; }
    @media (max-width: 1000px) { .dashboard-grid { grid-template-columns: 1fr; } .full-width { grid-column: span 1; } }

    /* SECTION CONTAINERS */
    .section-container { background: var(--bg-card); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); border: 1px solid var(--border-color); transition: background 0.3s, border-color 0.3s; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--hover-bg); padding-bottom: 12px; }
    /* RANGE TOOLBAR */
    .range-toolbar { display: flex; align-items: center; gap: 12px; }
    .range-group { display: flex; background: #f3f4f6; padding: 4px; border-radius: 8px; gap: 4px; }
    .range-btn { border: none; background: transparent; padding: 6px 16px; font-size: 0.8rem; font-weight: 600; color: #6b7280; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
    .range-btn:hover { background: rgba(0,0,0,0.05); color: #374151; }
    .range-btn.active { background: white; color: #111827; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    
    .date-picker-trigger { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #f3f4f6; border-radius: 8px; font-size: 0.85rem; font-weight: 600; color: #374151; cursor: pointer; position: relative; border: 1px solid transparent; }
    .date-picker-trigger:hover { border-color: #d1d5db; }
    .calendar-icon { font-size: 1rem; }

    /* CALENDAR POPUP */
    .calendar-popup { position: absolute; top: 110%; right: 0; background: #1e293b; color: white; padding: 16px; border-radius: 12px; width: 320px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); z-index: 100; font-family: 'Inter', sans-serif; }
    .cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-weight: 600; }
    .cal-nav { background: transparent; border: 1px solid #475569; color: white; border-radius: 4px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; margin-bottom: 16px; }
    .cal-day-head { font-size: 0.7rem; color: #94a3b8; padding-bottom: 8px; font-weight: 600; }
    .cal-day { font-size: 0.8rem; padding: 6px; border-radius: 4px; cursor: pointer; color: #e2e8f0; }
    .cal-day:hover { background: #334155; }
    .cal-day.dim { color: #475569; }
    .cal-day.range-start { background: #4f46e5; color: white; border-radius: 4px 0 0 4px; }
    .cal-day.range-mid { background: rgba(79, 70, 229, 0.3); border-radius: 0; }
    .cal-day.range-end { background: #4f46e5; color: white; border-radius: 0 4px 4px 0; }
    
    .cal-footer { display: flex; justify-content: flex-end; gap: 8px; padding-top: 12px; border-top: 1px solid #334155; }
    .btn-clean.small { font-size: 0.75rem; padding: 4px 10px; border-color: #475569; color: white; background: transparent; }
    .btn-clean.small:hover { background: #334155; }
    .btn-primary.small { font-size: 0.75rem; padding: 4px 12px; margin-top: 0; }

    .time-toggle span:hover { background: #e5e7eb; color: #374151; }
    .time-toggle span.active { background: white; color: #4f46e5; box-shadow: 0 1px 2px rgba(0,0,0,0.05); font-weight: 600; }
    h2 { font-size: 1rem; font-weight: 700; color: #374151; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; }

    /* SNAPSHOT */
    .snapshot-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .kpi-card { background: var(--bg-card); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); position: relative; }
    .kpi-card.danger-border { border-left: 4px solid #ef4444; background: rgba(254, 242, 242, 0.1); }
    .kpi-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
    .kpi-value { font-size: 1.5rem; font-weight: 900; color: var(--text-main); margin: 4px 0; }
    .kpi-sub { font-size: 0.75rem; color: var(--text-muted); }
    .trend { display: inline-flex; align-items: center; gap: 4px; font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-top: 4px; }
    .trend.up { background: #ecfdf5; color: #059669; }
    .trend.down { background: #fef2f2; color: #dc2626; }
    .trend.neutral { background: #f3f4f6; color: #4b5563; }
    .trend-icon { width: 12px; height: 12px; }
    
    :host.dark-theme .trend.up { background: rgba(6, 95, 70, 0.3); color: #6ee7b7; }
    :host.dark-theme .trend.down { background: rgba(153, 27, 27, 0.3); color: #fca5a5; }
    :host.dark-theme .trend.neutral { background: rgba(75, 85, 99, 0.3); color: #9ca3af; }

    .text-red { color: #dc2626; }
    .red-flag-row { display: flex; justify-content: space-between; font-size: 0.8rem; margin-top: 4px; }

    /* SALES MIX */
    .mix-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 0.85rem; }
    .mix-name { width: 120px; font-weight: 500; }
    .mix-name.highlight { color: #4f46e5; font-weight: 700; }
    .mix-bar-container { flex: 1; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
    .mix-bar { height: 100%; background: #9ca3af; }
    .mix-bar.highlight { background: #4f46e5; }
    .mix-bar.addon { background: #10b981; }
    .mix-val { width: 40px; text-align: right; font-weight: 600; }
    .mix-rev { width: 60px; text-align: right; color: var(--text-muted); }
    
    .insight-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px; }
    :host.dark-theme .insight-box { background: rgba(120, 53, 15, 0.1); border-color: rgba(245, 158, 11, 0.2); }
    
    .insight-item { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px; color: #92400e; }
    :host.dark-theme .insight-item { color: #fcd34d; }

    /* FUNNEL */
    .funnel-viz { display: flex; flex-direction: column; align-items: center; }
    .funnel-step { width: 100%; display: flex; flex-direction: column; align-items: center; }
    .step-box { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; font-weight: 600; padding: 10px; border-radius: 8px; text-align: center; margin-bottom: 4px; box-shadow: var(--shadow-sm); }
    :host.dark-theme .step-box { background: rgba(30, 58, 138, 0.2); border-color: rgba(30, 58, 138, 0.4); color: #93c5fd; }
    
    .step-box.wide { width: 100%; }
    .step-box.medium { width: 70%; }
    .step-box.narrow { width: 40%; }
    .step-box.success { background: #ecfdf5; border-color: #6ee7b7; color: #047857; }
    :host.dark-theme .step-box.success { background: rgba(6, 95, 70, 0.2); border-color: rgba(6, 95, 70, 0.4); color: #6ee7b7; }
    
    .funnel-connector { font-size: 1.2rem; color: #9ca3af; line-height: 1; margin: 4px 0; }
    .abandon-stat { font-size: 0.75rem; color: #ef4444; font-weight: 600; margin-top: 2px; }
    .conversion-rate { margin-top: 12px; font-size: 0.9rem; color: var(--text-muted); }
    :host.dark-theme .conversion-rate { color: #94a3b8; }

    /* GRAPHS ROW */
    .graphs-row { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 40px; align-items: start; }
    .graph-box h3 { font-size: 0.85rem; color: #6b7280; margin-bottom: 24px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .svg-chart-container { width: 100%; height: 220px; position: relative; margin-bottom: 10px; }
    .line-chart { width: 100%; height: 100%; overflow: visible; }
    .chart-labels { display: flex; justify-content: space-between; margin-top: 16px; font-size: 0.75rem; color: #6b7280; font-weight: 500; padding: 0 10px; }
    
    .pie-layout { display: flex; align-items: center; gap: 24px; height: 220px; }
    .pie-chart { width: 160px; height: 160px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 0 1px #e5e7eb; flex-shrink: 0; }
    .pie-legend { display: flex; flex-direction: column; gap: 12px; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: #4b5563; }
    .dot { width: 10px; height: 10px; border-radius: 50%; }

    .mt-4 { margin-top: 24px; }
    .bar-chart-container { display: flex; align-items: flex-end; justify-content: space-around; height: 160px; padding-top: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;}
    .bar-group { display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; justify-content: flex-end; width: 40px; }
    .bar-val { width: 24px; background: #10b981; border-radius: 4px 4px 0 0; transition: height 0.5s; opacity: 0.8; min-height: 4px; }
    .bar-val:hover { opacity: 1; transform: scaleY(1.05); transform-origin: bottom; }
    .bar-label { font-size: 0.65rem; color: #9ca3af; margin-top: 4px; }

    .device-stats { display: flex; flex-direction: column; gap: 20px; margin-top: 15px; }
    .device-row { display: flex; align-items: center; gap: 12px; font-size: 0.85rem; }
    .dev-icon { width: 24px; text-align: center; font-size: 1.1rem; }
    .dev-name { width: 70px; font-weight: 500; color: #4b5563; }
    .dev-bar-bg { flex: 1; height: 12px; background: #f3f4f6; border-radius: 6px; overflow: hidden; }
    .dev-bar { height: 100%; background: #4f46e5; border-radius: 6px; }
    .dev-pct { width: 40px; text-align: right; font-weight: 700; color: #111827; }

    .eng-item { background: #f9fafb; padding: 12px; border-radius: 8px; text-align: center; }
    .eng-val { display: block; font-size: 1.2rem; font-weight: 700; color: #111827; }
    .eng-label { font-size: 0.75rem; color: #6b7280; }
    .eng-trend.down { color: #dc2626; font-size: 0.7rem; display: block; }
    .alert-banner { padding: 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 500; text-align: center; }
    .alert-banner.warn { background: #fff7ed; color: #ea580c; border: 1px solid #fdba74; }
    .engagement-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .text-blur { filter: blur(4px); user-select: none; opacity: 0.5; }

    /* ALERTS LIST */
    .alerts-list { display: flex; flex-direction: column; gap: 8px; }
    .alert-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-radius: 6px; background: white; border: 1px solid #e5e7eb; font-size: 0.85rem; }
    .alert-item.critical { border-left: 4px solid #ef4444; background: #fef2f2; }
    .alert-item.warn { border-left: 4px solid #f59e0b; background: #fffbeb; }
    .alert-content { display: flex; gap: 8px; align-items: center; }
    .action-btn { font-size: 0.7rem; padding: 4px 8px; border: 1px solid #d1d5db; background: white; border-radius: 4px; cursor: pointer; }
    .action-btn:hover { background: #f3f4f6; }

    /* TABLE */
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .data-table th { text-align: left; padding: 8px; background: #f9fafb; color: #6b7280; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; }
    .data-table td { padding: 12px 8px; border-top: 1px solid #f3f4f6; }
    .badge { padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 700; }
    .badge.SUPER_ADMIN { background: #fee2e2; color: #991b1b; }
    .badge.USER { background: #f3f4f6; color: #374151; }
    .role-select { padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.85rem; width: 100%; }
    
    /* SPECIFIC TABLE VISUALS */
    .user-layout th:nth-child(1) { width: 90%; }
    .user-layout th:nth-child(2) { width: 10%; text-align: right; }

    .customer-layout th:nth-child(1) { width: 50px; } /* # */
    .customer-layout th:nth-child(2) { width: 30%; } /* Customer */
    .customer-layout th:nth-child(3) { width: 15%; } /* Joined */
    .customer-layout th:nth-child(4) { width: 15%; } /* Books */
    .customer-layout th:nth-child(5) { width: 15%; } /* Credits */
    .customer-layout th:nth-child(6) { width: 15%; } /* Child Profile */
    
    .data-table td { padding: 12px 8px; border-top: 1px solid #f3f4f6; vertical-align: middle; }

    .user-cell { display: flex; align-items: center; gap: 12px; }
    .avatar-sm { width: 32px; height: 32px; background: #e0e7ff; color: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; }
    .text-gray { color: #9ca3af; font-size: 0.75rem; }
    .search-box { padding: 4px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.85rem; margin-right: 12px; }
    .actions { display: flex; align-items: center; }
    .role-select.mini { font-size: 0.7rem; padding: 2px; height: auto; }
    .mt-1 { margin-top: 4px; }
    .tags-row { display: flex; gap: 4px; flex-wrap: wrap; }
    .tag { background: #f3f4f6; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; color: #4b5563; border: 1px solid #e5e7eb; }
    .text-red { color: #ef4444; }
    .flex-col { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
    .voice-info { font-size: 0.8rem; color: #4b5563; }
    .credits-val { font-weight: 600; color: #059669; }

    /* PROFILE DETAIL */
    .mb-4 { margin-bottom: 24px; }
    .profile-header { display: flex; align-items: center; gap: 24px; }
    .avatar-lg { width: 80px; height: 80px; background: #4f46e5; color: white; font-size: 2rem; font-weight: 700; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
    .profile-info h2 { font-size: 1.5rem; margin-bottom: 4px; }
    .profile-info p { color: #6b7280; }
    .profile-stats { margin-left: auto; display: flex; gap: 24px; text-align: center; }
    .stat-box h3 { font-size: 1.5rem; font-weight: 800; color: #111827; margin: 0; }
    .stat-box span { font-size: 0.75rem; text-transform: uppercase; color: #9ca3af; font-weight: 600; }
    .hover-rows tbody tr:hover { background-color: #f9fafb; }
    .badge.success { background: #dcfce7; color: #166534; }

    /* SIDEBAR & HEADER */
    .sidebar-header { height: 72px; display: flex; align-items: center; padding: 0 24px; border-bottom: 1px solid #eee; }
    .logo { font-size: 1.4rem; font-weight: 800; color: #4f46e5; }
    .logo span { color: black; }
    .sidebar-nav { padding: 24px 16px; }
    .nav-label { font-size: 0.8rem; font-weight: 800; color: #9ca3af; text-transform: uppercase; margin: 20px 0 10px 12px; letter-spacing: 0.05em; }
    .nav-item { display: flex; gap: 12px; padding: 12px 14px; border-radius: 8px; cursor: pointer; color: #4b5563; font-weight: 600; font-size: 1rem; transition: 0.1s; margin-bottom: 4px; }
    .nav-item:hover { background: #f3f4f6; color: black; }
    .nav-item.active { background: #eef2ff; color: #4f46e5; font-weight: 700; }
    .icon { width: 22px; text-align: center; }
    .badge-count { background: #ef4444; color: white; font-size: 0.65rem; padding: 2px 6px; border-radius: 12px; margin-left: auto; }
    .sidebar-footer { padding: 16px; border-top: 1px solid var(--border-color); text-align: center; font-size: 0.8rem; color: var(--text-muted); }
    .logout-btn { width: 100%; padding: 8px; background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .logout-btn:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: #ef4444; }

    .top-header { height: 60px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; padding: 0 24px; }
    .header-left h1 { font-size: 1.1rem; font-weight: 700; margin: 0; }
    .header-left h1 { font-size: 1.1rem; font-weight: 700; margin: 0; }
    .loading-badge { font-size: 0.7rem; background: #e0e7ff; color: #4f46e5; padding: 2px 6px; border-radius: 4px; margin-left: 8px; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .role-badge { font-size: 0.8rem; font-weight: 500; color: #6b7280; }
    .role-badge.admin { color: #dc2626; background: #fef2f2; padding: 2px 8px; rounded: 4px; }
    .role-badge { font-size: 0.8rem; font-weight: 500; color: #6b7280; }
    .role-badge.admin { color: #dc2626; background: #fef2f2; padding: 2px 8px; rounded: 4px; }
    .avatar { width: 32px; height: 32px; background: #4f46e5; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    
    /* HEADER RIGHT & DROPDOWN */
    .header-right { display: flex; align-items: center; gap: 20px; position: relative; }
    .notification-wrapper { position: relative; height: 40px; width: 40px; display: flex; align-items: center; justify-content: center; }

    .icon-btn { background: transparent; border: 1px solid transparent; cursor: pointer; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); transition: all 0.2s; }
    .icon-btn:hover { background: var(--bg-app); color: var(--text-main); border-color: var(--border-color); box-shadow: var(--shadow-sm); }
    .svg-icon { width: 24px; height: 24px; }
    .svg-icon-sm { width: 16px; height: 16px; color: var(--text-muted); }
    
    .profile-trigger { display: flex; align-items: center; gap: 10px; padding: 6px 12px; border-radius: 30px; cursor: pointer; transition: all 0.2s; user-select: none; border: 1px solid transparent; }
    .profile-trigger:hover { background: var(--bg-app); border-color: var(--border-color); box-shadow: var(--shadow-sm); }
    .avatar-circle { width: 36px; height: 36px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3); }
    .user-name-display { font-weight: 600; font-size: 0.95rem; color: var(--text-main); }
    
    .profile-dropdown { position: absolute; top: calc(100% + 12px); right: 0; width: 260px; background: var(--bg-card); border-radius: 16px; box-shadow: var(--shadow-lg); border: 1px solid var(--border-color); z-index: 205; overflow: hidden; animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    
    .dropdown-header-info { padding: 20px; border-bottom: 1px solid var(--border-color); background: var(--hover-bg); }
    .dd-name { font-weight: 700; color: var(--text-main); font-size: 1rem; }
    .dd-email { font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; }
    
    .dropdown-list { padding: 8px; }
    .dd-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; font-size: 0.9rem; color: var(--text-main); cursor: pointer; border-radius: 10px; transition: all 0.2s; font-weight: 500; }
    .dd-item:hover { background: var(--hover-bg); color: var(--primary); }
    .dd-icon { font-size: 1.2rem; width: 24px; text-align: center; opacity: 0.8; }
    .dd-divider { height: 1px; background: var(--border-color); margin: 8px 16px; opacity: 0.5; }

    /* NOTIFICATION POPUP */
    .notification-popup { position: absolute; top: 48px !important; right: -170px; left: auto; margin: 0; width: 380px; background: #1f2937; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4); z-index: 200; overflow: visible; color: white; animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1); border: 1px solid rgba(255,255,255,0.1); font-family: 'Inter', sans-serif; transform: none; }
    :host.dark-theme .notification-popup { background: var(--bg-card); border-color: var(--border-color); }
    
    .notification-popup::before { content: ''; position: absolute; top: -6px; left: 50%; right: auto; transform: translateX(-50%) rotate(45deg); width: 12px; height: 12px; background: #1f2937; border-left: 1px solid rgba(255,255,255,0.1); border-top: 1px solid rgba(255,255,255,0.1); z-index: 201; }
    :host.dark-theme .notification-popup::before { background: var(--bg-card); border-color: var(--border-color); }
    
    .notif-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); border-top-left-radius: 16px; border-top-right-radius: 16px; background: inherit; }
    .notif-header h3 { margin: 0; font-size: 1rem; font-weight: 600; color: white; }
    :host.dark-theme .notif-header h3 { color: var(--text-main); }
    
    .close-btn { background: transparent; border: none; color: #9ca3af; font-size: 1.2rem; cursor: pointer; padding: 4px; }
    .close-btn:hover { color: white; }
    :host.dark-theme .close-btn:hover { color: var(--text-main); }
    
    .notif-list { max-height: 400px; overflow-y: auto; padding: 8px; }
    .notif-item { display: flex; gap: 12px; padding: 12px; border-radius: 12px; cursor: pointer; transition: background 0.2s; }
    .notif-item:hover { background: rgba(255,255,255,0.1); }
    .notif-avatar { position: relative; width: 40px; height: 40px; flex-shrink: 0; }
    .notif-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
    .status-dot { position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #ef4444; border: 2px solid #1f2937; border-radius: 50%; }
    
    .notif-content { flex: 1; font-size: 0.85rem; }
    .notif-text { margin: 0 0 4px 0; line-height: 1.4; color: #e5e7eb; }
    .notif-text strong { color: white; font-weight: 600; }
    .notif-meta { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #9ca3af; }
    .project-tag { color: #d1d5db; font-weight: 500; }
    
    .notif-footer { padding: 12px; border-top: 1px solid rgba(255,255,255,0.1); }
    .view-all-btn { width: 100%; background: #374151; border: none; color: #e5e7eb; padding: 10px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .view-all-btn:hover { background: #4b5563; }

    
    .fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

    /* UTILS */
    .flex { display: flex; }
    .items-center { align-items: center; }
    .gap-2 { gap: 8px; }
    .mb-4 { margin-bottom: 16px; }
    .mt-2 { margin-top: 8px; }
    
    .text-center { text-align: center; }
    
    .btn-clean { border: 1px solid #d1d5db; background: white; padding: 4px 12px; border-radius: 4px; cursor: pointer; }
    .btn-icon { border: none; background: transparent; cursor: pointer; }
    .empty-state { text-align: center; padding: 60px; }
    .big-icon { font-size: 3rem; margin-bottom: 16px; }
    .btn-primary { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; margin-top: 16px; }
    .prop-row { display: flex; border-bottom: 1px solid #eee; padding: 12px 0; }
    .prop-row label { width: 100px; color: #6b7280; font-weight: 500; }
    .mono { font-family: monospace; }
    .text-right { text-align: right !important; }
    
    /* SYSTEM USER TABLE */
    .user-info-cell { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .role-selector-wrapper { position: relative; display: inline-block; }
    .role-select-badge { 
        appearance: none; 
        -webkit-appearance: none; 
        padding: 4px 24px 4px 10px; 
        border-radius: 20px; 
        font-size: 0.7rem; 
        font-weight: 700; 
        border: 1px solid transparent; 
        cursor: pointer; 
        outline: none; 
        background-color: #f3f4f6;
        color: #374151;
        transition: all 0.2s;
    }
    .role-select-badge:hover { filter: brightness(0.95); }
    .role-select-badge.SUPER_ADMIN, .role-select-badge.FINANCE_ADMIN { background: #fee2e2; color: #991b1b; }
    .role-select-badge.MARKETING { background: #fff7ed; color: #9a3412; }
    .role-select-badge.OPS_ADMIN { background: #e0e7ff; color: #3730a3; }
    .role-select-badge.DEVELOPER { background: #f0fdf4; color: #166534; }
    .role-select-badge.SUPPORT { background: #fdf4ff; color: #86198f; }
    .role-select-badge.USER { background: #f3f4f6; color: #374151; }
    
    .chevron-down-xs { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 0.5rem; pointer-events: none; opacity: 0.7; }
    
    .icon-btn-sm { background: transparent; border: none; cursor: pointer; padding: 6px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
    .icon-btn-sm:hover { background: #f3f4f6; }
    .icon-btn-sm.danger:hover { background: #fee2e2; color: #dc2626; }
    .svg-icon-xs { width: 18px; height: 18px; }
    
    /* Dark Mode Adjustments */
    :host.dark-theme .role-select-badge { background: #374151; color: #e5e7eb; }
    :host.dark-theme .role-select-badge.SUPER_ADMIN { background: rgba(153, 27, 27, 0.3); color: #fca5a5; }
    :host.dark-theme .role-select-badge.USER { background: rgba(55, 65, 81, 0.5); color: #d1d5db; }
    :host.dark-theme .text-main { color: var(--text-main); }
    :host.dark-theme .icon-btn-sm:hover { background: rgba(255, 255, 255, 0.1); }
    :host.dark-theme .icon-btn-sm.danger:hover { background: rgba(239, 68, 68, 0.2); }

    /* Custom Modal (SweetAlert style) - Copied from Login */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 2000; animation: fadeIn 0.3s ease-out; }
    .modal-box { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2); text-align: center; max-width: 400px; width: 90%; animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; font-family: 'Inter', sans-serif; }
    .modal-icon { font-size: 3rem; margin-bottom: 15px; display: block; }
    .modal-title { font-size: 1.5rem; font-weight: 700; color: #333; margin-bottom: 10px; }
    .modal-text { font-size: 1rem; color: #666; margin-bottom: 25px; line-height: 1.5; }
    .modal-actions { display: flex; gap: 12px; justify-content: center; }
    .modal-btn { background: #4f46e5; color: white; border: none; padding: 10px 24px; font-size: 1rem; font-weight: 600; border-radius: 6px; cursor: pointer; transition: background 0.2s; outline: none; }
    .modal-btn:hover { background: #4338ca; }
    .modal-btn.cancel-btn { background: #e5e7eb; color: #374151; }
    .modal-btn.cancel-btn:hover { background: #d1d5db; }
    .modal-btn.danger-btn { background: #ef4444; color: white; }
    .modal-btn.danger-btn:hover { background: #dc2626; }
    
    :host.dark-theme .modal-box { background: #1e293b; color: #e5e7eb; }
    :host.dark-theme .modal-title { color: white; }
    :host.dark-theme .modal-text { color: #9ca3af; }
    :host.dark-theme .modal-btn.cancel-btn { background: #334155; color: #e5e7eb; }
    :host.dark-theme .modal-btn.cancel-btn:hover { background: #475569; }

  `],
  host: {
    '[class.dark-theme]': 'isDarkMode'
  }
})
export class DashboardComponent implements OnInit {
  view: 'PULSE' | 'USERS' | 'CUSTOMERS' | 'CUSTOMER_DETAIL' | 'BOOKS' | 'PROFILE' | 'ALERTS' = 'BOOKS';
  isInternal = false;
  role = 'Loading...';
  userEmail = '';
  userId = '';
  pulse = MOCK_PULSE_DATA; // Start with mock, then we can bind real data later
  mockCustomers = MOCK_CUSTOMERS;
  notifications = MOCK_NOTIFICATIONS;
  selectedCustomer: any = null;
  timeRange: '7d' | '30d' | '90d' = '30d'; /* Default to 30d */
  users: any[] = [];
  loading = false;
  showProfileMenu = false;
  showNotifications = false;
  showCalendar = false;
  isDarkMode = false;

  // Modal State
  showModal = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'CONFIRM' | 'ALERT' = 'ALERT';
  modalAction: (() => void) | null = null;
  modalCancelAction: (() => void) | null = null;
  modalConfirmLabel = 'Confirm';

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  getTitle() {
    switch (this.view) {
      case 'PULSE': return 'Dashboard';
      case 'USERS': return 'User Management';
      case 'CUSTOMERS': return 'Customer Directory';
      case 'CUSTOMER_DETAIL': return 'Customer Profile';
      case 'ALERTS': return 'Priority Actions';
      case 'BOOKS': return 'My Library';
      case 'PROFILE': return 'Account Settings';
      default: return 'Dashboard';
    }
  }

  async ngOnInit() {
    try {
      const session = await fetchAuthSession();
      if (!session.tokens) {
        this.router.navigate(['/login']);
        return;
      }
      this.userEmail = session.tokens.idToken?.payload['email'] as string;
      this.userId = session.userSub || '';
      this.fetchProfile();
    } catch (e) { this.router.navigate(['/login']); }
  }

  async fetchProfile() {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

      this.http.get<any>('http://localhost:3000/users/me', { headers }).subscribe({
        next: (data) => {
          this.role = data.role;
          this.isInternal = ['SUPER_ADMIN', 'FINANCE_ADMIN', 'OPS_ADMIN', 'DEVELOPER', 'SUPPORT', 'MARKETING'].includes(this.role);

          // If internal, default to Pulse. If user, default to Books.
          if (this.isInternal) this.view = 'PULSE'; else this.view = 'BOOKS';
          this.cdr.detectChanges();
        },
        error: () => {
          // FALLBACK FOR DEV/NO-BACKEND: Assume Super Admin to show UI
          console.warn('Backend unreachable. Falling back to Mock Super Admin mode.');
          this.role = 'SUPER_ADMIN';
          this.isInternal = true;
          this.view = 'PULSE';
          this.cdr.detectChanges();
        }
      });
    } catch (e) { }
  }

  async onLogout() {
    await signOut();
    this.router.navigate(['/login']);
  }

  async loadUsers() {
    this.view = 'USERS';
    this.loading = true;
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

      this.http.get<any[]>('http://localhost:3000/users', { headers }).subscribe({
        next: (data) => { this.users = data; this.loading = false; this.cdr.detectChanges(); },
        error: () => {
          this.loading = false;
          // Mock Users for Dev
          this.users = [
            { id: 'm1', email: 'founder@bravesoup.com', role: 'SUPER_ADMIN' },
            { id: 'm2', email: 'tech@bravesoup.com', role: 'DEVELOPER' },
            { id: 'm3', email: 'ops@bravesoup.com', role: 'OPS_ADMIN' },
            { id: 'm4', email: 'marketing@bravesoup.com', role: 'MARKETING' },
            { id: 'm5', email: 'support@bravesoup.com', role: 'SUPPORT' }
          ];
          this.cdr.detectChanges();
        }
      });
    } catch (e) { this.loading = false; }
  }

  // MODAL LOGIC
  showAlert(title: string, message: string) {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalType = 'ALERT';
    this.showModal = true;
    this.modalAction = () => { this.showModal = false; };
  }

  showConfirm(title: string, message: string, onConfirm: () => void, onCancel?: () => void, confirmLabel = 'Confirm') {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalType = 'CONFIRM';
    this.modalAction = onConfirm;
    this.modalCancelAction = onCancel || (() => { this.showModal = false; });
    this.modalConfirmLabel = confirmLabel;
    this.showModal = true;
  }

  onModalConfirm() {
    if (this.modalAction) this.modalAction();
    this.showModal = false;
  }

  onModalCancel() {
    if (this.modalCancelAction) this.modalCancelAction();
    this.showModal = false;
  }


  async updateRole(user: any, newRole: string) {
    // Constraint: Super Admin role cannot be changed to ANY other role
    if (user.role === 'SUPER_ADMIN') {
      this.showAlert('Action Denied', 'Super Admin role cannot be changed.');
      this.loadUsers(); // Revert UI
      return;
    }

    this.showConfirm(
      'Change User Role?',
      `Are you sure you want to change ${user.email}'s role to ${newRole}?`,
      async () => {
        // ACTION
        try {
          const session = await fetchAuthSession();
          const token = session.tokens?.accessToken?.toString();
          const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
          this.http.put(`http://localhost:3000/users/${user.id}/role`, { role: newRole }, { headers }).subscribe({
            next: () => {
              user.role = newRole;
              this.showAlert('Success', 'User role updated successfully.');
            },
            error: (e) => {
              console.error(e);
              this.showAlert('Error', 'Failed to update role.');
              this.loadUsers();
            }
          });
        } catch (e) { }
      },
      () => {
        // CANCEL/REVERT
        this.loadUsers();
      },
      'Yes, Change Role'
    );
  }

  async deleteUser(user: any) {
    this.showConfirm(
      'Delete User?',
      `Are you sure you want to permanently delete ${user.email}? This action cannot be undone.`,
      () => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.showAlert('Deleted', `${user.email} has been removed.`);
        // TODO: Call backend delete
      },
      undefined,
      'Delete User'
    );
  }

  selectTimeRange(range: '7d' | '30d' | '90d') {
    this.timeRange = range;
    // Update the executive pulse data based on selection
    // We use Object.assign to keep reference or just direct assignment
    this.pulse.executive = { ...MOCK_VARIANTS[range] };
    // Also update engagement if variant exists for it, otherwise keep default
    if ((MOCK_VARIANTS[range] as any).engagement) {
      this.pulse.engagement = { ...(MOCK_VARIANTS[range] as any).engagement };
    }
  }

  openCustomer(cust: any) {
    this.selectedCustomer = cust;
    this.view = 'CUSTOMER_DETAIL';
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
  }

  hasUnreadNotifications() {
    return this.notifications.some(n => n.unread);
  }
}
