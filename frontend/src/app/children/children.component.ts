import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Router } from '@angular/router';

interface Child {
    id: string;
    firstName: string;
    dob: string;
    avatarConfig?: any;
}

@Component({
    selector: 'app-children',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="children-container">
      <header class="page-header">
        <h1>My Family</h1>
        <button class="btn-primary" (click)="showForm = !showForm">
          {{ showForm ? 'Cancel' : '+ Add Child' }}
        </button>
      </header>

      <!-- Add Child Form -->
      <div *ngIf="showForm" class="add-child-form card">
        <h3>New Profile</h3>
        <div class="form-group">
          <label>First Name</label>
          <input type="text" [(ngModel)]="newChild.firstName" placeholder="e.g. Alice">
        </div>
        <div class="form-group">
          <label>Date of Birth</label>
          <input type="date" [(ngModel)]="newChild.dob">
        </div>
        <div class="form-actions">
           <button class="btn-primary" (click)="addChild()" [disabled]="!newChild.firstName">Save Profile</button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <p>Loading profiles...</p>
      </div>

      <!-- Children List -->
      <div class="children-grid" *ngIf="!loading">
        <div class="child-card" *ngFor="let child of children">
          <div class="avatar-placeholder">
             {{ child.firstName.charAt(0) }}
          </div>
          <div class="child-info">
            <h3>{{ child.firstName }}</h3>
            <p>{{ child.dob | date }}</p>
          </div>
          <button class="btn-select">Select Profile</button>
        </div>
        
        <div *ngIf="children.length === 0 && !showForm" class="empty-state">
           <p>No profiles added yet.</p>
           <button class="btn-link" (click)="showForm = true">Create your first child profile</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .children-container { padding: 2rem; max-width: 800px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 2rem; }
    
    .children-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; }
    .child-card { 
      background: white; border-radius: 16px; padding: 1.5rem; text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: transform 0.2s;
    }
    .child-card:hover { transform: translateY(-5px); }
    
    .avatar-placeholder {
      width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; font-size: 2rem; display: flex; align-items: center; justify-content: center;
      border-radius: 50%; margin: 0 auto 1rem auto; font-weight: bold;
    }
    
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; color: #4a5568; }
    .form-group input { 
      width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px;
    }
    
    .btn-primary { background: #5a67d8; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; }
    .btn-select { background: transparent; border: 2px solid #5a67d8; color: #5a67d8; padding: 0.5rem 1rem; border-radius: 8px; margin-top: 1rem; cursor: pointer; width: 100%; }
    .btn-select:hover { background: #ebf4ff; }
  `]
})
export class ChildrenComponent implements OnInit {
    children: Child[] = [];
    loading = true;
    showForm = false;

    newChild = {
        firstName: '',
        dob: ''
    };

    constructor(
        private http: HttpClient,
        private cdr: ChangeDetectorRef,
        private router: Router
    ) { }

    async ngOnInit() {
        await this.loadChildren();
    }

    async getAuthToken() {
        try {
            const session = await fetchAuthSession();
            return session.tokens?.accessToken?.toString();
        } catch {
            return null;
        }
    }

    async loadChildren() {
        const token = await this.getAuthToken();
        if (!token) {
            this.router.navigate(['/login']);
            return;
        }

        const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
        this.http.get<Child[]>('http://localhost:3000/children', { headers }).subscribe({
            next: (data) => {
                this.children = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    async addChild() {
        const token = await this.getAuthToken();
        if (!token) return;

        const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
        this.http.post('http://localhost:3000/children', this.newChild, { headers }).subscribe({
            next: (child: any) => {
                this.children.push(child);
                this.showForm = false;
                this.newChild = { firstName: '', dob: '' };
                this.cdr.detectChanges();
            },
            error: (err) => console.error(err)
        });
    }
}
