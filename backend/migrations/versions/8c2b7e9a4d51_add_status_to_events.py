"""add status column to events

Revision ID: 8c2b7e9a4d51
Revises: 5df4f47ee4dd
Create Date: 2026-07-24
"""
from alembic import op
import sqlalchemy as sa


revision = '8c2b7e9a4d51'
down_revision = '5df4f47ee4dd'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('events', schema=None) as batch_op:
        batch_op.add_column(sa.Column('status', sa.String(), server_default='approved', nullable=False))


def downgrade():
    with op.batch_alter_table('events', schema=None) as batch_op:
        batch_op.drop_column('status')