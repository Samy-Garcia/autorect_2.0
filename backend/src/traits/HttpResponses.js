const buildResponse = ({ok, message, data = null, error = null, meta = null }) => ({
  ok,
  message,
  data,
  error,
  meta,
  timestamp: new Date().toISOString(),
});

const HttpResponses = {
  ok(res, data = null, message = "Solicitud exitosa", meta = null) {
    return res.status(200).json(
      buildResponse({
        ok: true,
        message,
        data,
        meta,
      })
    );
  },

  created(res, data = null, message = "Recurso creado correctamente", meta = null) {
    return res.status(201).json(
      buildResponse({
        ok: true,
        message,
        data,
        meta,
      })
    );
  },

  noContent(res) {
    return res.status(204).send();
  },

  badRequest(res, message = "Solicitud invalida", error = null, meta = null) {
    return res.status(400).json(
      buildResponse({
        ok: false,
        message,
        error,
        meta,
      })
    );
  },

  unauthorized(res, message = "No autorizado", error = null, meta = null) {
    return res.status(401).json(
      buildResponse({
        ok: false,
        message,
        error,
        meta,
      })
    );
  },

  forbidden(res, message = "Acceso denegado", error = null, meta = null) {
    return res.status(403).json(
      buildResponse({
        ok: false,
        message,
        error,
        meta,
      })
    );
  },

  notFound(res, message = "Recurso no encontrado", error = null, meta = null) {
    return res.status(404).json(
      buildResponse({
        ok: false,
        message,
        error,
        meta,
      })
    );
  },

  conflict(res, message = "Conflicto en la solicitud", error = null, meta = null) {
    return res.status(409).json(
      buildResponse({
        ok: false,
        message,
        error,
        meta,
      })
    );
  },

  unprocessable(res, message = "Error de validacion", error = null, meta = null) {
    return res.status(422).json(
      buildResponse({
        ok: false,
        message,
        error,
        meta,
      })
    );
  },

  serverError(res, message = "Error interno del servidor", error = null, meta = null) {
    return res.status(500).json(
      buildResponse({
        ok: false,
        message,
        error,
        meta,
      })
    );
  },

  paginated(res, data = [], pagination = {}, message = "Listado obtenido correctamente") {
    return res.status(200).json(
      buildResponse({
        ok: true,
        message,
        data,
        meta: { pagination },
      })
    );
  },
};

export default HttpResponses;