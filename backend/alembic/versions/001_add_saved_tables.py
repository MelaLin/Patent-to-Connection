"""Add saved patents and inventors tables

Revision ID: 001_add_saved_tables
Revises: 
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_add_saved_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create saved_patents table
    op.create_table('saved_patents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('abstract', sa.Text(), nullable=False),
        sa.Column('assignee', sa.String(), nullable=False),
        sa.Column('inventors', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('link', sa.String(), nullable=True),
        sa.Column('date_filed', sa.DateTime(timezone=True), nullable=True),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_saved_patents_id'), 'saved_patents', ['id'], unique=False)
    op.create_index(op.f('ix_saved_patents_user_id'), 'saved_patents', ['user_id'], unique=False)

    # Create saved_inventors table
    op.create_table('saved_inventors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('linkedin_url', sa.String(), nullable=True),
        sa.Column('associated_patent_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['associated_patent_id'], ['saved_patents.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_saved_inventors_id'), 'saved_inventors', ['id'], unique=False)
    op.create_index(op.f('ix_saved_inventors_user_id'), 'saved_inventors', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_saved_inventors_user_id'), table_name='saved_inventors')
    op.drop_index(op.f('ix_saved_inventors_id'), table_name='saved_inventors')
    op.drop_table('saved_inventors')
    op.drop_index(op.f('ix_saved_patents_user_id'), table_name='saved_patents')
    op.drop_index(op.f('ix_saved_patents_id'), table_name='saved_patents')
    op.drop_table('saved_patents')
