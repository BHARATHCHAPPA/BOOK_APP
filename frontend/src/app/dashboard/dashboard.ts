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
  engagement: {
    booksCreated: 1024,
    newVersions: 312,
    aiNarrations: 56, // Low? 
    manualRecordings: 12,
    saveSlotsUsed: '45%'
  },
  alerts: [
    { level: 'critical', msg: '5 Chargebacks need review', action: 'Review' },
    { level: 'warn', msg: '12 Users have 0 save slots (Churn Risk)', action: 'View Users' },
    { level: 'info', msg: 'StoryMaker conversion dropped 2% this week', action: 'Check Pricing' },
    { level: 'critical', msg: 'Support Ticket #2991 flagged URGENT', action: 'Reply' }
  ]
};

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
                 <div class="nav-label">Pulse Check</div>
                 <a (click)="view = 'PULSE'" [class.active]="view === 'PULSE'" class="nav-item">
                     <span class="icon">💓</span> Executive Pulse
                 </a>
                 <div class="nav-label mt-4">Management</div>
                 <a (click)="loadUsers()" [class.active]="view === 'USERS'" class="nav-item">
                     <span class="icon">👥</span> User Manager
                 </a>
                 <a (click)="view = 'ALERTS'" [class.active]="view === 'ALERTS'" class="nav-item">
                     <span class="icon">🔔</span> Alerts <span class="badge-count" *ngIf="pulse.alerts.length">{{pulse.alerts.length}}</span>
                 </a>
             </ng-container>

             <!-- CONSUMER VIEW -->
             <div class="nav-label mt-4">My Account</div>
             <a (click)="view = 'BOOKS'" [class.active]="view === 'BOOKS'" class="nav-item">
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
                              <span class="active">Today</span><span>7d</span><span>30d</span>
                          </div>
                      </div>
                      <div class="snapshot-grid">
                          <!-- Revenue -->
                          <div class="kpi-card">
                              <div class="kpi-label">Gross Revenue</div>
                              <div class="kpi-value">{{ pulse.executive.revenue.total }}</div>
                              <div class="kpi-sub">Net: {{ pulse.executive.revenue.net }}</div>
                              <div class="trend up">{{ pulse.executive.revenue.growth }}</div>
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

                  <!-- SECTION 4: ENGAGEMENT (Churn Watch) -->
                  <div class="section-container">
                      <div class="section-header"><h2>Engagement Signals</h2></div>
                      <div class="engagement-grid">
                          <div class="eng-item">
                              <span class="eng-val">{{ pulse.engagement.booksCreated }}</span>
                              <span class="eng-label">Books Created</span>
                          </div>
                          <div class="eng-item">
                              <span class="eng-val">{{ pulse.engagement.aiNarrations }}</span>
                              <span class="eng-label">AI Narrations</span>
                              <span class="eng-trend down">Low Usage</span>
                          </div>
                          <div class="eng-item">
                              <span class="eng-val">{{ pulse.engagement.saveSlotsUsed }}</span>
                              <span class="eng-label">Save Slot Usage</span>
                          </div>
                          <div class="eng-item">
                              <span class="eng-val">{{ pulse.engagement.manualRecordings }}</span>
                              <span class="eng-label">Manual Voice</span>
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
                                  <select (change)="updateRole(user, $any($event.target).value)" [value]="user.role" class="role-select">
                                     <option value="USER">User</option>
                                     <option value="SUPER_ADMIN">Super Admin</option>
                                     <option value="FINANCE_ADMIN">Finance Admin</option>
                                     <option value="OPS_ADMIN">Ops Admin</option>
                                     <option value="DEVELOPER">Developer</option>
                                     <option value="SUPPORT">Support</option>
                                  </select>
                               </td>
                               <td>{{ user.credits || 0 }}</td>
                               <td class="text-right">
                                  <button (click)="deleteUser(user)" class="btn-icon">🗑️</button>
                               </td>
                            </tr>
                         </tbody>
                      </table>
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

    /* ENGAGEMENT */
    .engagement-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .eng-item { background: #f9fafb; padding: 12px; border-radius: 8px; text-align: center; }
    .eng-val { display: block; font-size: 1.2rem; font-weight: 700; color: #111827; }
    .eng-label { font-size: 0.75rem; color: #6b7280; }
    .eng-trend.down { color: #dc2626; font-size: 0.7rem; display: block; }
    .alert-banner { padding: 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 500; text-align: center; }
    .alert-banner.warn { background: #fff7ed; color: #ea580c; border: 1px solid #fdba74; }

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
    .role-select { padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.85rem; }

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
    .loading-badge { font-size: 0.7rem; background: #e0e7ff; color: #4f46e5; padding: 2px 6px; rounded; margin-left: 8px; }
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
  view: 'PULSE' | 'USERS' | 'BOOKS' | 'PROFILE' | 'ALERTS' = 'BOOKS';
  isInternal = false;
  role = 'Loading...';
  userEmail = '';
  userId = '';
  pulse = MOCK_PULSE_DATA; // Start with mock, then we can bind real data later
  users: any[] = [];
  loading = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  getTitle() {
    switch (this.view) {
      case 'PULSE': return 'Executive Pulse';
      case 'USERS': return 'User Management';
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
          this.isInternal = ['SUPER_ADMIN', 'FINANCE_ADMIN', 'OPS_ADMIN', 'DEVELOPER', 'SUPPORT'].includes(this.role);

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
}
