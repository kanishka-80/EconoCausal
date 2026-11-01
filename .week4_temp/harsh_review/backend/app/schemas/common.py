from typing import Any, Generic, List, Optional, TypeVar, Union
from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    loc: Optional[List[str]] = Field(default=None, description="Location of the error (e.g. body field path)")
    msg: str = Field(description="Error message")
    type: str = Field(description="Error type identifier")


class ErrorPayload(BaseModel):
    code: str = Field(description="Machine-readable error code")
    message: str = Field(description="Human-readable explanation")
    details: List[Union[ErrorDetail, str, Any]] = Field(
        default_factory=list,
        description="Specific field-level or validation details",
    )


class StandardResponse(BaseModel, Generic[T]):
    status: str = Field(default="success", description="Status indicator: success or error")
    data: T = Field(description="Enclosed payload")


class ErrorResponse(BaseModel):
    status: str = Field(default="error", description="Status indicator")
    error: ErrorPayload = Field(description="Error payload details")