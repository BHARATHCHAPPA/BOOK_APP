import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { fetchAuthSession, signOut } from 'aws-amplify/auth';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// --- MOCK DATA FOR BRAVESOUP PULSE ---
const MOCK_PULSE_DATA = {
  executive: {
    revenue: { total: '$24,502', net: '$21,005', growth: '+12%', trend: 'up' },
    orders: { count: 843, aov: '$29.00', perDay: 28, trend: 'up' },
    customers: { new: 612, returning: 231, storyMakerAdoption: '34%' },
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
  today: {
    revenue: { total: '$1,204', net: '$950', growth: '+2.1%', trend: 'up' },
    orders: { count: 32, aov: '$37.60', perDay: 32, trend: 'up' },
    customers: { new: 12, returning: 8, storyMakerAdoption: '28%' },
    redFlags: { refunds: 0, chargebacks: 0, failedPayments: 1 },
    engagement: { booksCreated: 45, newVersions: 12, cyaPaths: 4, aiNarrations: 3, manualRecordings: 1, saveSlotsUsed: '45%', creditsSpent: 20 }
  },
  '7d': {
    revenue: { total: '$8,450', net: '$7,100', growth: '+12%', trend: 'up' },
    orders: { count: 215, aov: '$39.20', perDay: 30, trend: 'up' },
    customers: { new: 85, returning: 42, storyMakerAdoption: '35%' },
    redFlags: { refunds: 2, chargebacks: 1, failedPayments: 3 },
    engagement: { booksCreated: 320, newVersions: 98, cyaPaths: 25, aiNarrations: 18, manualRecordings: 5, saveSlotsUsed: '46%', creditsSpent: 150 }
  },
  '30d': {
    revenue: { total: '$24,502', net: '$21,005', growth: '+8%', trend: 'up' },
    orders: { count: 843, aov: '$29.00', perDay: 28, trend: 'down' },
    customers: { new: 612, returning: 231, storyMakerAdoption: '34%' },
    redFlags: { refunds: 5, chargebacks: 1, failedPayments: 3 },
    engagement: { booksCreated: 1024, newVersions: 312, cyaPaths: 89, aiNarrations: 56, manualRecordings: 12, saveSlotsUsed: '45%', creditsSpent: 420 }
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
  avatar: name.charAt(0),
  books: [
    { title: 'The Lost World', type: 'Fiction', created: '2023-11-01', length: '4h 12m' },
    { title: 'My Memoirs', type: 'Biography', created: '2024-01-15', length: '6h 30m' },
    ...(i % 2 === 0 ? [{ title: 'Bedtime Stories', type: 'Children', created: '2024-02-10', length: '20m' }] : [])
  ],
  voices: [
    { name: 'My Clone', type: 'Cloned', status: 'Active' },
    ...(i % 3 === 0 ? [{ name: 'Grandma', type: 'Cloned', status: 'Processing' }] : [])
  ],
  transactions: [
    { date: '2024-01-15', desc: 'Credit Pack (50)', amount: '$49.00' },
    { date: '2023-12-10', desc: 'Subscription', amount: '$12.00' }
  ]
}));

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
                 <span class="role-badge" [class.admin]="isInternal">{{ role }}</span>
                 <div class="avatar">{{ userEmail.charAt(0).toUpperCase() }}</div>
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
                          <div class="time-toggle">
                              <span (click)="selectTimeRange('today')" [class.active]="timeRange === 'today'">Today</span>
                              <span (click)="selectTimeRange('7d')" [class.active]="timeRange === '7d'">7d</span>
                              <span (click)="selectTimeRange('30d')" [class.active]="timeRange === '30d'">30d</span>
                          </div>
                      </div>
                      <div class="snapshot-grid">
                          <!-- Revenue -->
                          <div class="kpi-card" *ngIf="role !== 'MARKETING'">
                              <div class="kpi-label">Gross Revenue</div>
                              <div class="kpi-value">{{ pulse.executive.revenue.total }}</div>
                              <div class="kpi-sub">Net (post-fees): {{ pulse.executive.revenue.net }}</div>
                              <div class="trend up">{{ pulse.executive.revenue.growth }}</div>
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
                              <div class="trend up">Daily: {{ pulse.executive.orders.perDay }}</div>
                          </div>
                          <!-- Customers -->
                          <div class="kpi-card">
                              <div class="kpi-label">StoryMaker Adoption</div>
                              <div class="kpi-value">{{ pulse.executive.customers.storyMakerAdoption }}</div>
                              <div class="kpi-sub">{{ pulse.executive.customers.new }} New Customers</div>
                              <div class="trend neutral">Stable</div>
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
                      <div class="section-header"><h2>Sales & Product Mix</h2></div>
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
                      <div class="section-header"><h2>Funnel Health</h2></div>
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
                      <div class="section-header"><h2>Growth Trends</h2></div>
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
                      <div class="section-header"><h2>Additional Metrics</h2></div>
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
                      <div class="section-header"><h2>Customer Activity & Engagement</h2></div>
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
                      <table class="data-table">
                         <thead>
                            <tr><th>User</th><th>Role</th><th>Change Role</th><th>Credits</th><th class="text-right">Actions</th></tr>
                         </thead>
                         <tbody>
                            <tr *ngFor="let user of users">
                               <td><div class="font-bold">{{ user.email }}</div><small>{{ user.id }}</small></td>
                               <td><span class="badge" [ngClass]="user.role">{{ user.role }}</span></td>
                               <td>
                                  <select (change)="updateRole(user, $any($event.target).value)" [value]="user.role" class="role-select mini mt-1">
                                     <option value="USER" *ngIf="user.role === 'USER'">User</option>
                                     <option value="SUPER_ADMIN">Super Admin</option>
                                     <option value="FINANCE_ADMIN">Finance Admin</option>
                                     <option value="OPS_ADMIN">Ops Admin</option>
                                     <option value="DEVELOPER">Developer</option>
                                     <option value="MARKETING">Marketing</option>
                                     <option value="SUPPORT">Support</option>
                                  </select>
                               </td>
                               <td>{{ user.role === 'SUPER_ADMIN' ? '' : (user.credits || 0) }}</td>
                               <td class="text-right">
                                  <button (click)="deleteUser(user)" class="btn-icon">🗑️</button>
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
                      <table class="data-table hover-rows">
                         <thead>
                            <tr><th>Customer</th><th>Role</th><th>Joined</th><th>Total Books</th><th>Credits</th><th>Status</th></tr>
                         </thead>
                         <tbody>
                            <tr *ngFor="let cust of mockCustomers" (click)="openCustomer(cust)" style="cursor: pointer">
                               <td>
                                   <div class="user-cell">
                                       <div class="avatar-sm">{{ cust.avatar }}</div>
                                       <div>
                                           <div class="font-bold">{{ cust.name }}</div>
                                           <small class="text-gray">{{ cust.email }}</small>
                                       </div>
                                   </div>
                               </td>
                               <td><span class="badge" [class.success]="cust.role === 'Premium'">{{ cust.role }}</span></td>
                               <td>{{ cust.joined }}</td>
                               <td>{{ cust.books.length }}</td>
                               <td>{{ cust.credits }}</td>
                               <td><span class="dot" style="background: #10b981"></span> Active</td>
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
                              <div class="tags-row mt-2">
                                  <span class="badge">{{ selectedCustomer.role }}</span>
                                  <span class="badge text-gray">ID: {{ selectedCustomer.id }}</span>
                              </div>
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
                          <div class="section-header"><h2>📚 Books & Types</h2></div>
                          <table class="data-table">
                              <thead><tr><th>Title</th><th>Type</th><th>Length</th><th>Created</th></tr></thead>
                              <tbody>
                                  <tr *ngFor="let b of selectedCustomer.books">
                                      <td class="font-bold">{{ b.title }}</td>
                                      <td><span class="tag">{{ b.type }}</span></td>
                                      <td>{{ b.length }}</td>
                                      <td>{{ b.created }}</td>
                                  </tr>
                              </tbody>
                          </table>
                      </div>

                      <!-- Voices Table -->
                      <div class="section-container">
                          <div class="section-header"><h2>🎤 Voices</h2></div>
                          <table class="data-table">
                              <thead><tr><th>Name</th><th>Type</th><th>Status</th></tr></thead>
                              <tbody>
                                  <tr *ngFor="let v of selectedCustomer.voices">
                                      <td class="font-bold">{{ v.name }}</td>
                                      <td>{{ v.type }}</td>
                                      <td><span class="badge success">Active</span></td>
                                  </tr>
                              </tbody>
                          </table>
                      </div>

                      <!-- Credits/Transactions Table -->
                      <div class="section-container">
                          <div class="section-header"><h2>💳 Credit History</h2></div>
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
    </div>
  `,
  styles: [`
    /* GLOBAL RESET */
    :host { display: block; height: 100vh; overflow: hidden; font-family: 'Inter', sans-serif; color: #1f2937; background: #f3f4f6; }
    * { box-sizing: border-box; }

    /* LAYOUT GRID */
    .app-layout { display: flex; height: 100%; }
    .sidebar { width: 280px; background: white; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; flex-shrink: 0; }
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
    .content-scroll { flex: 1; overflow-y: auto; padding: 24px; background: #f3f4f6; } /* Grey bg */
    
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
    .section-container { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f3f4f6; padding-bottom: 12px; }
    .time-toggle { background: #f3f4f6; padding: 4px; border-radius: 8px; display: flex; gap: 4px; }
    .time-toggle span { font-size: 0.75rem; color: #6b7280; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
    .time-toggle span:hover { background: #e5e7eb; color: #374151; }
    .time-toggle span.active { background: white; color: #4f46e5; box-shadow: 0 1px 2px rgba(0,0,0,0.05); font-weight: 600; }
    h2 { font-size: 1rem; font-weight: 700; color: #374151; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; }

    /* SNAPSHOT */
    .snapshot-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .kpi-card { background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; position: relative; }
    .kpi-card.danger-border { border-left: 4px solid #ef4444; background: #fef2f2; }
    .kpi-label { font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; }
    .kpi-value { font-size: 1.5rem; font-weight: 800; color: #111827; margin: 4px 0; }
    .kpi-sub { font-size: 0.75rem; color: #9ca3af; }
    .trend { display: inline-block; font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-top: 4px; }
    .trend.up { background: #ecfdf5; color: #059669; }
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
    .mix-rev { width: 60px; text-align: right; color: #6b7280; }
    .insight-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px; }
    .insight-item { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px; }

    /* FUNNEL */
    .funnel-viz { display: flex; flex-direction: column; align-items: center; }
    .funnel-step { width: 100%; display: flex; flex-direction: column; align-items: center; }
    .step-box { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; font-weight: 600; padding: 8px; border-radius: 6px; text-align: center; margin-bottom: 4px; }
    .step-box.wide { width: 100%; }
    .step-box.medium { width: 70%; }
    .step-box.narrow { width: 40%; }
    .step-box.success { background: #ecfdf5; border-color: #6ee7b7; color: #047857; }
    .funnel-connector { font-size: 1.2rem; color: #9ca3af; line-height: 1; margin: 4px 0; }
    .abandon-stat { font-size: 0.75rem; color: #dc2626; font-weight: 600; }
    .conversion-rate { margin-top: 12px; font-size: 0.9rem; color: #374151; }

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
    .data-table th { text-align: left; padding: 8px; background: #f9fafb; color: #6b7280; font-size: 0.75rem; text-transform: uppercase; }
    .data-table td { padding: 12px 8px; border-top: 1px solid #f3f4f6; }
    .badge { padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 700; }
    .badge.SUPER_ADMIN { background: #fee2e2; color: #991b1b; }
    .badge.USER { background: #f3f4f6; color: #374151; }
    .role-select { padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.85rem; width: 100%; }
    .data-table th:nth-child(1) { width: 25%; } /* Customer */
    .data-table th:nth-child(2) { width: 15%; } /* Profile */
    .data-table th:nth-child(3) { width: 8%; }  /* Books */
    .data-table th:nth-child(4) { width: 20%; } /* Type */
    .data-table th:nth-child(5) { width: 12%; } /* Voices */
    .data-table th:nth-child(6) { width: 10%; } /* Credits */
    .data-table th:nth-child(7) { width: 10%; text-align: right; } /* Actions */

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
    .nav-label { font-size: 0.8rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; margin: 20px 0 10px 12px; letter-spacing: 0.05em; }
    .nav-item { display: flex; gap: 12px; padding: 12px 14px; border-radius: 8px; cursor: pointer; color: #4b5563; font-weight: 500; font-size: 1rem; transition: 0.1s; margin-bottom: 4px; }
    .nav-item:hover { background: #f3f4f6; color: black; }
    .nav-item.active { background: #eef2ff; color: #4f46e5; font-weight: 600; }
    .icon { width: 22px; text-align: center; }
    .badge-count { background: #ef4444; color: white; font-size: 0.65rem; padding: 2px 6px; border-radius: 12px; margin-left: auto; }
    .sidebar-footer { padding: 16px; border-top: 1px solid #eee; text-align: center; font-size: 0.8rem; color: #9ca3af; }
    .logout-btn { width: 100%; padding: 8px; background: white; border: 1px solid #fecaca; color: #dc2626; border-radius: 6px; margin-bottom: 8px; cursor: pointer; }

    .top-header { height: 60px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; padding: 0 24px; }
    .header-left h1 { font-size: 1.1rem; font-weight: 700; margin: 0; }
    .header-left h1 { font-size: 1.1rem; font-weight: 700; margin: 0; }
    .loading-badge { font-size: 0.7rem; background: #e0e7ff; color: #4f46e5; padding: 2px 6px; border-radius: 4px; margin-left: 8px; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .role-badge { font-size: 0.8rem; font-weight: 500; color: #6b7280; }
    .role-badge.admin { color: #dc2626; background: #fef2f2; padding: 2px 8px; rounded: 4px; }
    .avatar { width: 32px; height: 32px; background: #4f46e5; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    
    .fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

    /* UTILS */
    .btn-clean { border: 1px solid #d1d5db; background: white; padding: 4px 12px; border-radius: 4px; cursor: pointer; }
    .btn-icon { border: none; background: transparent; cursor: pointer; }
    .empty-state { text-align: center; padding: 60px; }
    .big-icon { font-size: 3rem; margin-bottom: 16px; }
    .btn-primary { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; margin-top: 16px; }
    .prop-row { display: flex; border-bottom: 1px solid #eee; padding: 12px 0; }
    .prop-row label { width: 100px; color: #6b7280; font-weight: 500; }
    .mono { font-family: monospace; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
  `]
})
export class DashboardComponent implements OnInit {
  view: 'PULSE' | 'USERS' | 'CUSTOMERS' | 'CUSTOMER_DETAIL' | 'BOOKS' | 'PROFILE' | 'ALERTS' = 'BOOKS';
  isInternal = false;
  role = 'Loading...';
  userEmail = '';
  userId = '';
  pulse = MOCK_PULSE_DATA; // Start with mock, then we can bind real data later
  mockCustomers = MOCK_CUSTOMERS;
  selectedCustomer: any = null;
  timeRange: 'today' | '7d' | '30d' = '30d'; /* Default to 30d to match initial data */
  users: any[] = [];
  loading = false;

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
          this.role = 'USER';
          this.view = 'BOOKS';
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
        error: () => { this.loading = false; }
      });
    } catch (e) { this.loading = false; }
  }

  async updateRole(user: any, newRole: string) {
    if (!confirm(`Change role of ${user.email} to ${newRole}?`)) return;
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
      this.http.put(`http://localhost:3000/users/${user.id}/role`, { role: newRole }, { headers }).subscribe({
        next: () => { user.role = newRole; alert('Role updated!'); },
        error: (e) => console.error(e)
      });
    } catch (e) { }
  }
  async deleteUser(user: any) {
    if (!confirm(`Delete ${user.email}?`)) return;
    this.users = this.users.filter(u => u.id !== user.id);
    // TODO: Call backend delete
  }

  selectTimeRange(range: 'today' | '7d' | '30d') {
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
}
