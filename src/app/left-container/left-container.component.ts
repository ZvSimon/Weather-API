import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  faMagnifyingGlass,
  faLocation,
  faCloud,
  faCloudRain,
} from '@fortawesome/free-solid-svg-icons';
import { WeatherService } from '../Services/weather.service';

@Component({
  selector: 'app-left-container',
  templateUrl: './left-container.component.html',
  styleUrls: ['./left-container.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeftContainerComponent {
  faMagnifyingGlass = faMagnifyingGlass;
  faLocation = faLocation;
  faCloud = faCloud;
  faCloudRain = faCloudRain;

  constructor(public weatherService: WeatherService) {}

  onSearch(location: string): void {
    if (location) {
      this.weatherService.cityName = location;
      this.weatherService.getData();
    }
  }
}
