import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';

import { DashboardComponent } from './dashboard/dashboard';
import { BooksComponent } from './books/books.component';
import { ChildrenComponent } from './children/children.component';
import { ReaderComponent } from './reader/reader.component';
import { AdminDashboardComponent } from './admin/admin-dashboard.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'books', component: BooksComponent },
    { path: 'children', component: ChildrenComponent },
    { path: 'read/:id', component: ReaderComponent },
    { path: 'admin', component: AdminDashboardComponent }
];
