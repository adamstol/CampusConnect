"""add notifications table

Revision ID: a1b2c3d4e5f6
Revises: 8c2b7e9a4d51
Create Date: 2026-07-28
"""
from alembic import op
import sqlalchemy as sa


revision = 'a1b2c3d4e5f6'
down_revision = '8c2b7e9a4d51'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'notifications',
        sa.Column('notification_id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('body', sa.String(), nullable=False),
        sa.Column('is_read', sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('club_id', sa.Integer(), sa.ForeignKey('clubs.club_id'), nullable=True),
        sa.Column('announcement_id', sa.Integer(), sa.ForeignKey('announcements.announcement_id'), nullable=True),
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])


def downgrade():
    op.drop_index('ix_notifications_user_id', table_name='notifications')
    op.drop_table('notifications')
