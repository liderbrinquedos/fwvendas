import logging

import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception,
    before_sleep_log,
)

from app.core.config import settings

logger = logging.getLogger(__name__)


def _should_retry(exc: BaseException) -> bool:
    if isinstance(exc, (httpx.TimeoutException, httpx.ConnectError)):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code >= 500
    return False


class ERPClientError(Exception):
    pass


class ERPClient:
    def __init__(self):
        self.base_url = settings.erp_api_url.rstrip("/")
        self.token = settings.erp_api_token
        self.timeout = settings.erp_timeout_seconds
        self.headers = {
            "Accept": "application/json",
        }
        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=4),
        retry=retry_if_exception(_should_retry),
        before_sleep=before_sleep_log(logger, logging.WARNING),
    )
    async def _request(self, path: str, params: dict | None = None) -> dict:
        normalized = path.rstrip("/") + "/"
        url = f"{self.base_url}{normalized}"
        async with httpx.AsyncClient(timeout=self.timeout, verify=False, follow_redirects=True) as client:
            resp = await client.get(url, headers=self.headers, params=params)
            if resp.status_code in (401, 403):
                raise ERPClientError(f"Auth error: {resp.status_code}")
            if resp.status_code == 404:
                return {"success": False, "data": []}
            resp.raise_for_status()
            return resp.json()

    async def get_all_paginated(self, path: str, params: dict | None = None) -> list[dict]:
        results = []
        page = 0
        req_params = dict(params or {})
        while True:
            req_params["page"] = page
            req_params["page_size"] = 1000
            data = await self._request(path, params=req_params)
            items = data.get("data", [])
            if not items:
                break
            results.extend(items)
            page += 1
        return results

    async def get_vendedores(self, alterado_desde: str | None = None) -> list[dict]:
        params = {}
        if alterado_desde:
            params["alterado_desde"] = alterado_desde
        return await self.get_all_paginated("/vendedores", params)

    async def get_clientes(self, alterado_desde: str | None = None) -> list[dict]:
        params = {}
        if alterado_desde:
            params["alterado_desde"] = alterado_desde
        return await self.get_all_paginated("/clientes", params)

    async def get_enderecos(self, codparc: int | None = None) -> list[dict]:
        params = {}
        if codparc:
            params["codparc"] = codparc
        return await self.get_all_paginated("/enderecos", params)

    async def get_produtos(self, alterado_desde: str | None = None) -> list[dict]:
        params = {}
        if alterado_desde:
            params["alterado_desde"] = alterado_desde
        return await self.get_all_paginated("/produtos", params)

    async def get_produtos_logistica(self) -> list[dict]:
        return await self.get_all_paginated("/produtos/logistica")

    async def get_precos(self, codtab: int = 45) -> list[dict]:
        return await self.get_all_paginated("/precos", {"codtab": codtab})

    async def get_pedidos(self, alterado_desde: str | None = None) -> list[dict]:
        params = {}
        if alterado_desde:
            params["alterado_desde"] = alterado_desde
        return await self.get_all_paginated("/pedidos", params)

    async def get_pedido_itens(self, nunota: int) -> list[dict]:
        data = await self._request(f"/pedidos/{nunota}/itens")
        if isinstance(data, list):
            return data
        return data.get("data", [])

    async def get_transportadoras(self, alterado_desde: str | None = None) -> list[dict]:
        params = {}
        if alterado_desde:
            params["alterado_desde"] = alterado_desde
        return await self.get_all_paginated("/transportadoras", params)

    async def get_carteira(self) -> list[dict]:
        return await self.get_all_paginated("/carteira")

    async def get_empresas(self) -> list[dict]:
        return await self.get_all_paginated("/empresas")

    async def get_tabelas_preco(self) -> list[dict]:
        return await self.get_all_paginated("/tabelas-preco")

    async def get_financeiro(self) -> list[dict]:
        return await self.get_all_paginated("/financeiro/comercial")

    async def get_tipos_negociacao(self) -> list[dict]:
        return await self.get_all_paginated("/tipos-negociacao")

    async def get_tipos_operacao(self) -> list[dict]:
        return await self.get_all_paginated("/tipos-operacao")

    async def test_connection(self) -> dict:
        try:
            import time
            start = time.time()
            data = await self._request("/vendedores", params={"page": 0, "page_size": 1})
            latency = round(time.time() - start, 2)
            return {"ok": True, "latency": latency}
        except ERPClientError as e:
            logger.warning("ERP auth error during test_connection: %s", e)
            return {"ok": False, "error": f"Erro de autenticação: {e}"}
        except httpx.ConnectError as e:
            logger.warning("ERP connection error during test_connection: %s", e)
            return {"ok": False, "error": f"Não foi possível conectar ao ERP: {e}"}
        except httpx.TimeoutException as e:
            logger.warning("ERP timeout during test_connection: %s", e)
            return {"ok": False, "error": f"Timeout ao conectar ao ERP ({self.timeout}s): {e}"}
        except httpx.HTTPStatusError as e:
            logger.warning("ERP HTTP %d error during test_connection", e.response.status_code)
            return {"ok": False, "error": f"Erro HTTP {e.response.status_code} do ERP"}
        except Exception as e:
            logger.exception("Unexpected error during test_connection")
            return {"ok": False, "error": f"Erro desconhecido: {type(e).__name__}: {e}"}
