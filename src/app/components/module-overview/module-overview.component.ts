import { Component } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { ActivatedRoute } from '@angular/router';
import {
  EChartsOption,
  XAXisComponentOption,
  YAXisComponentOption,
  SeriesOption,
} from 'echarts';
import { combineLatest, map, Observable, switchMap } from 'rxjs';
import { ModuleI, ReadoutI } from 'src/app/models';

@Component({
  selector: 'sen-module-overview',
  templateUrl: './module-overview.component.html',
  styleUrls: ['./module-overview.component.scss'],
})
export class ModuleOverviewComponent {
  //! querying is sooo bad with rtdb maybe I really should just go with firestore
  chartOption$: Observable<EChartsOption>;

  constructor(
    private activeRoute: ActivatedRoute,
    private db: AngularFireDatabase,
  ) {
    this.chartOption$ = this.activeRoute.params.pipe(
      map(params => params['id']),
      switchMap((id: string) => {
        const module$ = this.db.object<ModuleI>(`modules/${id}`).valueChanges();
        const readouts$ = this.db
          .list<ReadoutI>('readouts', ref =>
            ref.orderByChild('moduleId').equalTo(id),
          )
          .valueChanges();
        return combineLatest([module$, readouts$]);
      }),
      map(([module, readouts]) => {
        if (!readouts) {
          return {};
        }
        const xAxis: XAXisComponentOption = {
          type: 'time',
          alignTicks: true,
          axisLabel: {
            formatter: function (value: number) {
              let date = new Date(value);
              if (date.getHours() === 0) {
                return date.toLocaleDateString();
              }

              return date.toLocaleTimeString();
            },
          },
        };
        const humidity = readouts.map(readout => [
          readout.timestamp,
          readout.bme.humidity,
        ]);
        const temperature = readouts.map(readout => [
          readout.timestamp,
          readout.bme.temperature,
        ]);
        const yAxisHumidity: YAXisComponentOption = {
          type: 'value',
          name: 'Humidity',
        };
        const yAxisTemperature: YAXisComponentOption = {
          name: 'Temperature',
          alignTicks: true,
          type: 'value',
        };
        const yAxis: YAXisComponentOption[] = [yAxisHumidity, yAxisTemperature];
        const humiditySeries: SeriesOption = {
          name: 'Humidity',
          type: 'line',
          data: humidity,
        };
        const temperatureSeries: SeriesOption = {
          name: 'Temperature',
          type: 'line',
          data: temperature,
          yAxisIndex: 1,
        };
        const series: SeriesOption[] = [humiditySeries, temperatureSeries];
        const chartOption: EChartsOption = {
          title: {
            text: `${module?.name} - Humidity vs Temperature`,
            left: 'center',
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'cross',
            },
          },
          yAxis,
          xAxis,
          series,
        };
        return chartOption;
      }),
    );
  }
}
