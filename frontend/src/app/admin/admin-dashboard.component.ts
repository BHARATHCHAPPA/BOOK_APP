import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { fetchAuthSession } from 'aws-amplify/auth';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
   selector: 'app-admin-dashboard',
   standalone: true,
   imports: [CommonModule, FormsModule],
   template: `
    <div class="admin-container">
      <header class="admin-header">
        <div>
          <h1>Executive Pulse</h1>
          <p class="subtitle">Real-time SaaS Health Check</p>
        </div>
        <div class="header-actions">
           <button class="nav-btn" [class.active]="view === 'DASH'" (click)="view = 'DASH'">Pulse Board</button>
           <button class="nav-btn" [class.active]="view === 'USERS'" (click)="view = 'USERS'; loadUsers()">User Manager</button>
           <button class="nav-btn exit-btn" (click)="goBack()">Exit Admin</button>
        </div>
      </header>

      <!-- VIEW: DASHBOARD (Full Rich Layout) -->
      <div *ngIf="view === 'DASH'" class="fade-in">
         
         <!-- 1. Executive Snapshot -->
         <div class="snapshot-grid">
             <div class="card metric-card">
                <h3>Gross Revenue</h3>
                <div class="value">$2,450</div>
                <div class="trend up">▲ 12% vs yesterday</div>
             </div>
             <div class="card metric-card">
                <h3>Net Revenue</h3>
                <div class="value">$2,108</div>
                <div class="sub-text">(after Stripe fees)</div>
             </div>
             <div class="card metric-card">
                <h3>Total Orders</h3>
                <div class="value">84</div>
                <div class="trend up">▲ 5%</div>
             </div>
             <div class="card metric-card">
                <h3>StoryMaker Adoption</h3>
                <div class="value">34%</div>
                <div class="sub-text">Tier 2 uptake is healthy</div>
             </div>
             <div class="card metric-card danger-border">
                <h3>Red Flags</h3>
                <div class="flex-row">
                    <span>Refunds: <b class="red">1</b></span>
                    <span>Chargebacks: <b class="red">0</b></span>
                </div>
             </div>
         </div>

         <!-- 2. Sales & Funnel Section -->
         <div class="mid-grid">
             <!-- Product Mix -->
             <div class="card">
                <h2>Product Mix</h2>
                <div class="mix-table">
                   <div class="row header">
                      <span>Product</span>
                      <span>Orders</span>
                      <span>Revenue</span>
                   </div>
                   <div class="row">
                      <span>Name Book (Tier 1)</span>
                      <span>45</span>
                      <span>$1,125</span>
                   </div>
                   <div class="row highlight">
                      <span>StoryMaker (Tier 2)</span>
                      <span>28</span>
                      <span>$980</span>
                   </div>
                   <div class="row">
                      <span>Add-ons</span>
                      <span>11</span>
                      <span>$345</span>
                   </div>
                </div>
                <div class="insight-box">
                    <strong>Insight:</strong> Upsell conversion is 18%.
                </div>
             </div>

             <!-- Funnel Health -->
             <div class="card">
                <h2>Funnel Health</h2>
                <div class="funnel-steps">
                   <div class="step">
                      <span class="label">Visitors</span>
                      <span class="count">1,240</span>
                   </div>
                   <div class="arrow">↓ 12%</div>
                   <div class="step success">
                      <span class="label">Purchases</span>
                      <span class="count">84</span>
                   </div>
                </div>
                <div class="abandoned-alert">
                   ⚠️ 64 Abandoned Carts Today
                </div>
             </div>
         </div>

         <!-- 3. Alerts & Engagement -->
         <div class="alerts-section">
             <h2>⚠️ Alerts & Action Items (Founder Brain)</h2>
             <div class="alert-list">
                 <div class="alert-item critical">
                    <span class="icon">🔥</span>
                    <span class="msg">5 Chargebacks need review immediately</span>
                    <button>Review</button>
                 </div>
                 <div class="alert-item warn">
                    <span class="icon">⚠️</span>
                    <span class="msg">12 Users have 0 save slots (Churn Risk)</span>
                    <button>View Users</button>
                 </div>
             </div>
         </div>
      </div>

      <!-- VIEW: USER MANAGER -->
      <div *ngIf="view === 'USERS'" class="user-manager fade-in">
          <div class="card">
             <div class="card-header-row">
                 <h2>User Management</h2>
                 <button class="refresh-btn" (click)="loadUsers()">↻ Refresh</button>
             </div>
             
             <div class="loading" *ngIf="loading">Loading users...</div>
             
             <div class="table-container">
                 <table class="user-table" *ngIf="!loading">
                    <thead>
                       <tr>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Credits</th>
                          <th>Change Role</th>
                          <th>Actions</th>
                       </tr>
                    </thead>
                    <tbody>
                       <tr *ngFor="let user of users">
                          <td>{{ user.email }}</td>
                          <td><span class="badge" [ngClass]="user.role">{{ user.role }}</span></td>
                          <td>{{ user.credits }}</td>
                          <td>
                             <select (change)="updateRole(user, $any($event.target).value)" [value]="user.role">
                                <option value="USER">USER</option>
                                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                                <option value="FINANCE_ADMIN">FINANCE_ADMIN</option>
                                <option value="OPS_ADMIN">OPS_ADMIN</option>
                                <option value="DEVELOPER">DEVELOPER</option>
                                <option value="SUPPORT">SUPPORT</option>
                             </select>
                          </td>
                          <td>
                              <button class="btn-delete" (click)="deleteUser(user)">Delete</button>
                          </td>
                       </tr>
                    </tbody>
                 </table>
             </div>
          </div>
      </div>

    </div>
  `,
   styles: [`
    .admin-container { padding: 2rem; background: #f0f2f5; min-height: 100vh; font-family: 'Inter', sans-serif; }
    .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    h1 { margin: 0; font-size: 1.8rem; color: #1a202c; }
    .subtitle { margin: 0; color: #718096; }
    
    /* Nav */
    .header-actions { display: flex; gap: 1rem; }
    .nav-btn { background: white; border: 1px solid #e2e8f0; padding: 0.5rem 1.2rem; cursor: pointer; font-weight: 600; color: #4a5568; border-radius: 6px; transition: all 0.2s; }
    .nav-btn:hover { background: #edf2f7; }
    .nav-btn.active { background: #2b6cb0; color: white; border-color: #2b6cb0; }
    .exit-btn { color: #c53030; border-color: #feb2b2; }
    .exit-btn:hover { background: #fff5f5; }

    /* Snapshot Grid */
    .snapshot-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .metric-card h3 { margin: 0 0 0.5rem 0; font-size: 0.85rem; color: #718096; text-transform: uppercase; font-weight: 700; }
    .value { font-size: 1.8rem; font-weight: 700; color: #2d3748; }
    .trend { font-size: 0.85rem; margin-top: 0.25rem; }
    .trend.up { color: #38a169; }
    .sub-text { font-size: 0.8rem; color: #a0aec0; }
    .danger-border { border-left: 4px solid #e53e3e; }
    .red { color: #e53e3e; }
    .flex-row { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.9rem; }

    /* Mid Grid */
    .mid-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-bottom: 2rem; }
    @media (max-width: 900px) { .mid-grid { grid-template-columns: 1fr; } }
    
    /* Mix Table */
    .mix-table .row { display: grid; grid-template-columns: 2fr 1fr 1fr; padding: 0.75rem 0; border-bottom: 1px solid #edf2f7; }
    .header { font-weight: 600; color: #718096; font-size: 0.85rem; }
    .highlight { background: #ebf8ff; margin: 0 -0.5rem; padding: 0.75rem 0.5rem; border-radius: 4px; }
    .insight-box { margin-top: 1rem; background: #fffaf0; padding: 0.8rem; border-left: 4px solid #ed8936; font-size: 0.9rem; color: #744210; }

    /* Funnel */
    .funnel-steps { display: flex; flex-direction: column; align-items: center; }
    .step { width: 100%; border: 1px solid #e2e8f0; padding: 0.8rem; text-align: center; border-radius: 6px; background: #f7fafc; }
    .step.success { background: #f0fff4; border-color: #9ae6b4; }
    .arrow { color: #718096; font-size: 0.9rem; margin: 0.4rem 0; }
    .abandoned-alert { margin-top: 1rem; color: #c53030; background: #fff5f5; padding: 0.5rem; border-radius: 4px; font-weight: 600; font-size: 0.85rem; width: 100%; text-align: center; }

    /* Alerts */
    .alerts-section { margin-bottom: 2rem; }
    .alert-item { display: flex; align-items: center; padding: 1rem; border-radius: 6px; background: white; margin-bottom: 0.5rem; border: 1px solid #e2e8f0; }
    .alert-item.critical { border-left: 5px solid #e53e3e; }
    .alert-item.warn { border-left: 5px solid #ecc94b; }
    .icon { font-size: 1.2rem; margin-right: 1rem; }
    .msg { flex-grow: 1; font-weight: 500; }

    /* User Manager */
    .table-container { overflow-x: auto; }
    .user-table { width: 100%; border-collapse: collapse; min-width: 600px; }
    .user-table th { text-align: left; padding: 1rem; background: #f7fafc; border-bottom: 2px solid #e2e8f0; font-size: 0.85rem; color: #4a5568; }
    .user-table td { padding: 1rem; border-bottom: 1px solid #e2e8f0; color: #2d3748; }
    
    .badge { padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; display: inline-block; }
    .badge.SUPER_ADMIN { background: #fed7d7; color: #9b2c2c; }
    .badge.FINANCE_ADMIN { background: #feebc8; color: #dd6b20; }
    .badge.OPS_ADMIN { background: #c6f6d5; color: #276749; }
    .badge.DEVELOPER { background: #bee3f8; color: #2c5282; }
    .badge.SUPPORT { background: #e9d8fd; color: #553c9a; }
    .badge.USER { background: #edf2f7; color: #4a5568; }

    select { padding: 0.4rem; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 0.9rem; }
    .btn-delete { background: #fff5f5; color: #c53030; border: 1px solid #feb2b2; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; transition: 0.2s; }
    .btn-delete:hover { background: #c53030; color: white; }
    
    .card-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .refresh-btn { background: none; border: none; color: #3182ce; cursor: pointer; font-weight: 600; }
  `]
})
export class AdminDashboardComponent implements OnInit {
   view: 'DASH' | 'USERS' = 'DASH';
   users: any[] = [];
   loading = false;

   constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private router: Router) { }

   ngOnInit() { }

   goBack() {
      this.router.navigate(['/dashboard']);
   }

   async loadUsers() {
      this.loading = true;
      try {
         const session = await fetchAuthSession();
         const token = session.tokens?.accessToken?.toString();
         const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

         this.http.get<any[]>('http://localhost:3000/users', { headers }).subscribe({
            next: (data) => {
               this.users = data;
               this.loading = false;
               this.cdr.detectChanges();
            },
            error: (err) => {
               console.error(err);
               this.loading = false;
            }
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
            next: () => {
               user.role = newRole; // Optimistic
               alert('Role updated!');
            },
            error: (err) => alert('Failed to update role. Ensure backend is running and you have permissions.')
         });
      } catch (e) { }
   }

   async deleteUser(user: any) {
      if (!confirm(`Are you sure you want to PERMANENTLY delete user ${user.email}?`)) return;

      try {
         const session = await fetchAuthSession();
         const token = session.tokens?.accessToken?.toString();
         const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

         this.http.delete(`http://localhost:3000/users/${user.id}`, { headers }).subscribe({
            next: () => {
               this.users = this.users.filter(u => u.id !== user.id);
               alert('User deleted.');
            },
            error: (err) => alert('Failed to delete user.')
         });
      } catch (e) { }
   }
}
