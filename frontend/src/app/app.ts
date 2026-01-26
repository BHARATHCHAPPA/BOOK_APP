import { Component } from '@angular/core';
import { Amplify } from 'aws-amplify';
import { environment } from '../environments/environment';
import { RouterOutlet } from '@angular/router';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.cognito.userPoolId,
      userPoolClientId: environment.cognito.userPoolClientId,
    }
  }
});

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent {
  title = 'frontend';
}
