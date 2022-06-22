import { NotFound } from '@feathersjs/errors'
import { _ } from '@feathersjs/commons';
import { AdapterService, ServiceOptions, InternalServiceMethods, AdapterParams } from '@feathersjs/adapter-commons';
import { NullableId, Id } from '@feathersjs/feathers';

interface AnyObj { [field: string]: any }

export interface PrismaServiceOptions<T = any> extends ServiceOptions {
  Model: any
}

export class Service<T = any, D = Partial<T>> extends AdapterService<T, D> implements InternalServiceMethods<T> {
  options: any
  Model: any

  constructor (options: Partial<PrismaServiceOptions<T>> = {}) {
    super(_.extend({ id: 'id', }, options));
    this.Model = options.Model
  }

  async count ({ where }: any = {}) {
    const result = await this.Model.count({ where })
    return result
  }

  async _find (params: AdapterParams = {}) {
    const { query, filters, paginate } = this.filterQuery(params);
    const where = this.makeWhere(query)
    const select = this.makeSelect(params)
    const orderBy = this.makeOrderBy(filters.$sort)
    const take = filters.$limit
    const skip = filters.$skip

    const data = await this.Model.findMany({
      where,
      orderBy,
      select,
      take,
      skip,
    })

    const paginated = !!(paginate && (paginate ).default)

    const result = {
      total: paginated ? await this.count({ where }) : 0,
      limit: filters.$limit,
      skip: filters.$skip || 0,
      data
    };

    if (!paginated) {
      return result.data;
    }
    return result
  }

  async _get (id: Id, params: AdapterParams = {}) {
    const { query, filters, paginate } = this.filterQuery(params);
    const where = this.makeWhere(query, id)
    const select = this.makeSelect(params)

    let result

    try {
      result = await this.Model.findFirst({
        where,
        select,
      })
    } catch (error: any) {
      handleErrorTypes(error, id as Id)
    }

    if (!result) throwNotFound(id)

    return result
  }

  async _create (data: Partial<T> | Partial<T>[], params: AdapterParams = {}): Promise<T | T[]> {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this._create(current, params) as Promise<T>));
    }
    const select = this.makeSelect(params)

    const result = await this.Model.create({
      data,
      select,
    })
    return result
  }

  async _update (id: NullableId, data: T, params: AdapterParams = {}) {
    const { query, filters, paginate } = this.filterQuery(params);
    const where = this.makeWhere(query, id as Id)
    const select = this.makeSelect(params)

    const existing = await this._get(id as Id, params)

    if (!existing) {
      throwNotFound(id)
    }

    const updateData = prepareUpdateData(existing, data)

    let result
    try {
      result = await this.Model.update({
        data: updateData,
        where,
        select,
      })
    } catch (error) {
      handleErrorTypes(error, id as Id)
    }

    if (!result) throwNotFound(id)

    return result
  }

  async _patch (id: NullableId, data: Partial<T>, params: AdapterParams = {}) {
    const { query, filters, paginate } = this.filterQuery(params);
    const where = this.makeWhere(query, id as Id)
    const select = this.makeSelect(params)

    let result
    let existing

    if (!where.id) {
      existing =  await this._find(params)
    }
    try {
      const method = id == null ? 'updateMany' : 'update'
      result = await this.Model[method]({
        data,
        where,
        select,
      })
    } catch (error: any) {
      handleErrorTypes(error, id as Id)
    }

    if (!result) throwNotFound(id)

    if (result.count && existing.length) {
      result = await this._find({ query: { id: { in: existing.map((i: AnyObj) => i.id)}}})
    }

    return result
  }

  async _remove (id: NullableId, params: AdapterParams = {}): Promise<T|T[]> {
    const { query, filters, paginate } = this.filterQuery(params);
    const where = this.makeWhere(query, id as Id)
    const select = this.makeSelect(params)

    if (id === null) {
      const allRecords = await this.Model.findMany({ where })
      await this.Model.deleteMany({ where })
      return allRecords
    }

    let result
    try {
      result = await this.Model.delete({
        where,
        select,
      })
    } catch (error: any) {
      if (error.message.includes('needs exactly one argument')) {
        throwNotFound(`${id} + ${where.toString}`)
      }
    }

    if (!result) throwNotFound(id)

    return result
  }


  makeSelect (params: AdapterParams = {}) {
    const $select = params.query?.$select || []
    const select = $select.reduce((fields: any, field: string) => {
      fields[field] = true
      return fields
    }, { id: true })
    return params.query?.$select?.length ? select : undefined
  }

  makeOrderBy($sort: any = {}) {
    const orderBy = Object.keys($sort).reduce((orderBy, key) => {
      orderBy[key] = $sort[key] === 1
        ? 'asc'
        : $sort[key] === -1 ? 'desc'
        : undefined
      return orderBy
    }, {} as any)
    return orderBy
  }

  makeWhere(query: any = {}, id?: Id) {
    const where = clone(query)
    renameKeys(where)

    if (id != null && where.id && where.id !== id) throwNotFound(`${id} + ${where.id}`)
    if (id != null) where.id = id

    return where
  }
}

function rename(object: any, key: string, newKey: string) {
  object[newKey] = object[key]
  delete object[key]
}

function renameKeys(object: any) {
  if (_.isObjectOrArray(object)) {
    _.each(object, (value, key) => {
      renameKeys(object[key])
      if (key === '$in') rename(object, '$in', 'in')
      if (key === '$nin') rename(object, '$nin', 'notIn')
      if (key === '$or') {
        rename(object, '$or', 'OR')
        renameKeys(object.OR)
      }
      if (key === '$lt') rename(object, '$lt', 'lt')
      if (key === '$lte') rename(object, '$lte', 'lte')
      if (key === '$gt') rename(object, '$gt', 'gt')
      if (key === '$gte') rename(object, '$gte', 'gte')
      if (key === '$ne') rename(object, '$ne', 'not')
    })
  }
  return object
}
function clone(object: any) {
  if (!object || typeof object != 'object') {
    return object;
  }

  const cloneObj = (Array.isArray(object) ? [] : {}) as any;

  for (const attr in object) {
    if (typeof object[attr] == "object") {
      cloneObj[attr] = clone(object[attr]);
    } else {
      cloneObj[attr] = object[attr];
    }
  }

  return cloneObj;
}
function throwNotFound(id: any) {
  throw new NotFound(`No record found for id '${id}'`)
}
// Returns object where keys in `existing` that aren't in `data` are set to `null`.
function prepareUpdateData(existing: AnyObj, data: AnyObj) {
  const updateData = Object.keys(existing).reduce((newData: any, key: string) => {
    newData[key] = data[key] != null ? data[key] : null
    return newData
  }, {})
  delete updateData.id
  return updateData
}
function handleErrorTypes(error: any, id: Id) {
  if (error.message.includes('needs exactly one argument')) {
    throwNotFound(`${id}`)
  }
  if (error.message.includes('Argument id: Got invalid value ')) {
    throwNotFound(id)
  }
  throw error
}

export function prismaService (options: PrismaServiceOptions) {
  return new Service(options)
}