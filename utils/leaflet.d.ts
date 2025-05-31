declare namespace L {
  class Map {
    constructor(element: string | HTMLElement, options?: any);
    setView(center: [number, number], zoom: number): this;
    remove(): void;
    on(event: string, handler: Function): this;
    addLayer(layer: Layer): this;
  }
  
  class Layer {
    addTo(map: Map): this;
    remove(): void;
  }
  
  class TileLayer extends Layer {
    constructor(urlTemplate: string, options?: any);
  }
  
  class Marker extends Layer {
    constructor(latlng: [number, number], options?: any);
    bindTooltip(content: string, options?: any): this;
  }

  class LeafletEvent {
    latlng: { lat: number, lng: number };
  }
  
  function map(element: string | HTMLElement, options?: any): Map;
  function tileLayer(urlTemplate: string, options?: any): TileLayer;
  function marker(latlng: [number, number], options?: any): Marker;
}

interface Window {
  L: typeof L;
}