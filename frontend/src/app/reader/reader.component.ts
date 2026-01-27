import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { fetchAuthSession } from 'aws-amplify/auth';

@Component({
    selector: 'app-reader',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="reader-container" *ngIf="book">
      <!-- Toolbar -->
      <div class="toolbar">
        <button class="btn-back" (click)="goBack()">← Library</button>
        <span class="book-title">{{ book.title }}</span>
        <div class="controls">
          <button (click)="prevPage()" [disabled]="page === 1">Prev</button>
          <span>Page {{ page }} of {{ totalPages }}</span>
          <button (click)="nextPage()" [disabled]="page === totalPages">Next</button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="content-viewer">
        <div class="page-sheet">
          <div class="page-content">
             <h2>Chapter {{ page }}</h2>
             <p *ngFor="let para of getDummyText()">
               {{ para }}
             </p>
             <div class="page-footer">
               {{ page }}
             </div>
          </div>
        </div>
      </div>
    </div>
    
    <div *ngIf="loading" class="loading">Loading book...</div>
    <div *ngIf="error" class="error">{{ error }}</div>
  `,
    styles: [`
    .reader-container { height: 100vh; display: flex; flex-direction: column; background: #333; }
    .toolbar { 
      height: 60px; background: #1a1a1a; color: white; display: flex; 
      align-items: center; justify-content: space-between; padding: 0 2rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3); z-index: 10;
    }
    .btn-back { background: none; border: none; color: #aaa; cursor: pointer; font-size: 1rem; }
    .btn-back:hover { color: white; }
    
    .content-viewer { 
      flex-grow: 1; display: flex; justify-content: center; overflow-y: auto; padding: 2rem;
    }
    
    .page-sheet {
      width: 100%; max-width: 800px; min-height: 1000px;
      background: white; box-shadow: 0 0 20px rgba(0,0,0,0.5);
      padding: 4rem; margin-bottom: 2rem;
    }
    
    .page-content { font-size: 1.2rem; line-height: 1.8; color: #333; font-family: 'Georgia', serif; }
    .page-footer { margin-top: 4rem; text-align: center; color: #999; font-size: 0.9rem; }
    
    .loading, .error { color: white; text-align: center; margin-top: 4rem; }
  `]
})
export class ReaderComponent implements OnInit {
    book: any = null;
    loading = true;
    error = '';
    page = 1;
    totalPages = 10;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private http: HttpClient
    ) { }

    async ngOnInit() {
        const bookId = this.route.snapshot.paramMap.get('id');
        if (!bookId) return;

        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.accessToken?.toString();
            const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

            // Verify access (re-fetch book details to check ownership)
            // Ideally we would have a specific /read endpoint that validates ownership strictly
            this.http.get(`http://localhost:3000/books/${bookId}`, { headers }).subscribe({
                next: (data: any) => {
                    this.book = data;
                    this.loading = false;
                },
                error: (err) => {
                    this.error = "Could not load book. You may not own it.";
                    this.loading = false;
                }
            });
        } catch (e) {
            this.error = "Authentication error";
        }
    }

    goBack() {
        this.router.navigate(['/books']);
    }

    nextPage() { if (this.page < this.totalPages) this.page++; }
    prevPage() { if (this.page > 1) this.page--; }

    getDummyText() {
        return [
            "Once upon a time, in a land far far away...",
            "The sun was shining brighter than ever before, casting long golden shadows across the whispering meadows. Birds sang melodies that seemed to weave magic into the very air.",
            "Our hero, a small but brave adventurer, stepped forth onto the path that would change everything.",
            "It was not going to be an easy journey. There would be dragons, puzzles, and perhaps even broccoli for dinner. But courage is not the absence of fear, but the triumph over it.",
            "And so, with a deep breath and a backpack full of snacks, the adventure began."
        ];
    }
}
