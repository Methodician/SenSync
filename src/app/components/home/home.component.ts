import { Component, OnInit } from '@angular/core';
import { Database, ref, listVal } from '@angular/fire/database';
import { Observable } from 'rxjs';

@Component({
  selector: 'sen-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  item$: Observable<any>;

  constructor(db: Database) {
    const node = ref(db, 'readoutsByModuleId/FB1');
    this.item$ = listVal(node);
  }

  ngOnInit(): void {}
}
