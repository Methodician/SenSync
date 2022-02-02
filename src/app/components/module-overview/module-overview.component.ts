import { Component } from '@angular/core';
import {
  Database,
  equalTo,
  listVal,
  objectVal,
  orderByChild,
  query,
  ref,
  set,
} from '@angular/fire/database';
import { ActivatedRoute } from '@angular/router';
import {
  EChartsOption,
  XAXisComponentOption,
  YAXisComponentOption,
  SeriesOption,
} from 'echarts';
import { limitToLast } from 'firebase/database';
import { combineLatest, map, Observable, pipe, switchMap } from 'rxjs';

export interface ReadoutI {
  bme: {
    gas: number;
    humidity: number;
    pressure: number;
    temperature: number;
  };
  timestamp: number;
}

export interface KeyMapI<T> {
  [key: string]: T;
}

@Component({
  selector: 'sen-module-overview',
  templateUrl: './module-overview.component.html',
  styleUrls: ['./module-overview.component.scss'],
})
export class ModuleOverviewComponent {
  //! querying is sooo bad with rtdb maybe I really should just go with firestore
  chartOption$: Observable<EChartsOption>;

  constructor(private activeRoute: ActivatedRoute, private db: Database) {
    this.chartOption$ = this.activeRoute.params.pipe(
      map(params => params['id']),
      switchMap(id =>
        listVal<ReadoutI>(
          query(
            ref(this.db, 'readouts'),
            orderByChild('moduleId'),
            equalTo(id),
          ),
        ),
      ),
      map(readouts => {
        if (!readouts) {
          return {};
        }

        // const timestamps = readouts.map(readout => new Date(readout.timestamp).getMinutes());
        const timestamps = readouts.map(readout => readout.timestamp);
        const humidity = readouts.map(readout => readout.bme.humidity);
        const temperature = readouts.map(readout => readout.bme.temperature);

        const xAxis: XAXisComponentOption = {
          type: 'category',
          data: timestamps,
        };
        const humiditySeries: SeriesOption = {
          type: 'line',
          data: humidity,
        };
        const temperatureSeries: SeriesOption = {
          type: 'line',
          data: temperature,
        };
        const chartOption: EChartsOption = {
          xAxis,
          series: [humiditySeries, temperatureSeries],
          yAxis: { type: 'value' },
        };

        return chartOption;
      }),
    );
  }
}
