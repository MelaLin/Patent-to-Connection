"""Add saved queries and alerts tables

Revision ID: 002_add_queries_alerts
Revises: 001_add_saved_tables
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_add_queries_alerts'
down_revision = '001_add_saved_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create saved_queries table
    op.create_table('saved_queries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('query', sa.Text(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_saved_queries_id'), 'saved_queries', ['id'], unique=False)
    op.create_index(op.f('ix_saved_queries_user_id'), 'saved_queries', ['user_id'], unique=False)

    # Create saved_alerts table
    op.create_table('saved_alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('query', sa.Text(), nullable=False),
        sa.Column('frequency', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_saved_alerts_id'), 'saved_alerts', ['id'], unique=False)
    op.create_index(op.f('ix_saved_alerts_user_id'), 'saved_alerts', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_saved_alerts_user_id'), table_name='saved_alerts')
    op.drop_index(op.f('ix_saved_alerts_id'), table_name='saved_alerts')
    op.drop_table('saved_alerts')
    op.drop_index(op.f('ix_saved_queries_user_id'), table_name='saved_queries')
    op.drop_index(op.f('ix_saved_queries_id'), table_name='saved_queries')
    op.drop_table('saved_queries')
