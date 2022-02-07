import { Component } from '@angular/core';
import { Database, ref, listVal } from '@angular/fire/database';
import { Observable } from 'rxjs';

@Component({
  selector: 'sen-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  modules$: Observable<any>;

  constructor(db: Database) {
    const node = ref(db, 'modules');
    this.modules$ = listVal(node, { keyField: 'id' });
  }
}
