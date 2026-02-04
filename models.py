from sqlalchemy import Column, Integer, String, DateTime, JSON
from database import Base
from datetime import datetime

class VitalCycle(Base):
    __tablename__ = "vital_cycles"

    id = Column(Integer, primary_key=True, index=True)
    estado = Column(String)
    metricas = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
