import { Component } from '@angular/core';
import { Database, listVal, objectVal, ref } from '@angular/fire/database';
import { ActivatedRoute } from '@angular/router';
import {
  EChartsOption,
  XAXisComponentOption,
  YAXisComponentOption,
  SeriesOption,
} from 'echarts';
import { map, Observable, switchMap } from 'rxjs';

@Component({
  selector: 'sen-module-overview',
  templateUrl: './module-overview.component.html',
  styleUrls: ['./module-overview.component.scss'],
})
export class ModuleOverviewComponent {
  readouts$: Observable<any>;
  module$: Observable<any>;

  constructor(private activeRoute: ActivatedRoute, private db: Database) {
    this.readouts$ = this.activeRoute.params.pipe(
      map((params) => params['id']),
      switchMap((id) =>
        listVal(ref(this.db, `readoutsByModuleId/${id}`), { keyField: 'key' })
      )
    );
    this.module$ = this.activeRoute.params.pipe(
      map((params) => params['id']),
      switchMap((id) =>
        objectVal(ref(this.db, `modules/${id}`), { keyField: 'key' })
      )
    );
    this.readouts$
      .pipe(map((readout) => readout))
      .subscribe((readouts) => console.log(readouts));
    // this.xAxis$().subscribe(console.log);
  }

  xAxis$ = () =>
    this.readouts$.pipe(map((readout) => readout.timestamp.toDate()));

  series$ = () =>
    this.readouts$.pipe(map((readout) => readout.bme.temperature));

  chartOption = (): EChartsOption => {
    const xAxis: XAXisComponentOption = {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    };
    const yAxis: YAXisComponentOption = {
      type: 'value',
    };
    const series: any = [
      {
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        type: 'line',
      },
    ];

    return {
      xAxis,
      yAxis,
      series,
    };
    // return {
    //   xAxis: {
    //     type: 'category',
    //     data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    //   },
    //   yAxis: {
    //     type: 'value',
    //   },
    //   series: [
    //     {
    //       data: [820, 932, 901, 934, 1290, 1330, 1320],
    //       type: 'line',
    //     },
    //   ],
    // };
  };
}
