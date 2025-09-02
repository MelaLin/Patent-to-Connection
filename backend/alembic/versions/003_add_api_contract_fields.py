"""Add new fields for API contract

Revision ID: 003_add_api_contract_fields
Revises: 002_add_queries_alerts
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_add_api_contract_fields'
down_revision = '002_add_queries_alerts'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new fields to saved_patents table
    op.add_column('saved_patents', sa.Column('patent_number', sa.String(), nullable=True))
    op.add_column('saved_patents', sa.Column('google_patents_link', sa.String(), nullable=True))
    op.add_column('saved_patents', sa.Column('tags', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('saved_patents', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True))
    
    # Add new fields to saved_queries table
    op.add_column('saved_queries', sa.Column('filters', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('saved_queries', sa.Column('hash', sa.String(), nullable=True))
    op.add_column('saved_queries', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True))
    
    # Create indexes for idempotency
    op.create_index(op.f('ix_saved_patents_patent_number'), 'saved_patents', ['patent_number'], unique=False)
    op.create_index(op.f('ix_saved_queries_hash'), 'saved_queries', ['hash'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_saved_queries_hash'), table_name='saved_queries')
    op.drop_index(op.f('ix_saved_patents_patent_number'), table_name='saved_patents')
    
    # Drop columns from saved_queries table
    op.drop_column('saved_queries', 'updated_at')
    op.drop_column('saved_queries', 'hash')
    op.drop_column('saved_queries', 'filters')
    
    # Drop columns from saved_patents table
    op.drop_column('saved_patents', 'updated_at')
    op.drop_column('saved_patents', 'tags')
    op.drop_column('saved_patents', 'google_patents_link')
    op.drop_column('saved_patents', 'patent_number')
