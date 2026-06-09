// Mirrors model/custom_response.dart
export class CustomResponse<T = any> {
  statusCode: number;
  object: T;
  msg: string;
  success: boolean;

  constructor(statusCode: number, object: T, msg: string | undefined, success: boolean) {
    this.statusCode = statusCode;
    this.object = object;
    this.msg = msg ?? '';
    this.success = success;
  }
}

// Mirrors PageEntity<T> (entities/base_entities/page_entity.dart)
export interface PageEntity<T> {
  data: T[];
  totalPage: number;
  page?: number;
  itemCount?: number;
  unreadCount?: number;
  total?: number;
}
