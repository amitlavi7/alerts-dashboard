export interface Alert {
  data: string;
  alertDate: string;
  category: string;
  category_desc: string;
  matrix_id?: string;
  rid?: string;
  outLat?: number;
  outLong?: number;
  inLat?: number;
  inLong?: number;
}
