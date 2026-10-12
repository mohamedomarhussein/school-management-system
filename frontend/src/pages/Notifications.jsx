import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  CircleCheck,
  CreditCard,
  Inbox,
  LoaderCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import api from "../services/api";
import "./Notifications.css";

function getNotificationIcon(type) {
  const normalizedType = String(type || "").toLowerCase();

  if (normalizedType.includes("exam")) {
    return CalendarDays;
  }

  if (
    normalizedType.includes("payment") ||
    normalizedType.includes("fee") ||
    normalizedType.includes("finance")
  ) {
    return CreditCard;
  }

  if (
    normalizedType.includes("attendance") ||
    normalizedType.includes("student")
  ) {
    return CircleCheck;
  }

  return Bell;
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const [notificationsResponse, countResponse] = await Promise.all([
        api.get("/notifications"),
        api.get("/notifications/unread-count"),
      ]);

      setNotifications(notificationsResponse.data.data || []);
      setUnreadCount(countResponse.data.unread_count || 0);
    } catch (requestError) {
      console.error("Failed to load notifications:", requestError);

      setError(
        requestError.response?.data?.message ||
          "Unable to load notifications. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (notificationId) => {
    setBusyId(notificationId);
    setActionError("");

    try {
      await api.patch(`/notifications/${notificationId}/read`);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );

      setUnreadCount((current) =>
        Math.max(
          0,
          current -
            (notifications.find(
              (notification) => notification.id === notificationId
            )?.is_read
              ? 0
              : 1)
        )
      );
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message ||
          "Could not mark this notification as read."
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    setMarkingAll(true);
    setActionError("");

    try {
      await api.patch("/notifications/read-all");

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );

      setUnreadCount(0);
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message ||
          "Could not mark all notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (notificationId) => {
    setBusyId(notificationId);
    setActionError("");

    try {
      await api.delete(`/notifications/${notificationId}`);

      const deletedNotification = notifications.find(
        (notification) => notification.id === notificationId
      );

      setNotifications((current) =>
        current.filter(
          (notification) => notification.id !== notificationId
        )
      );

      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message ||
          "Could not delete this notification."
      );
    } finally {
      setBusyId(null);
    }
  };

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((notification) => !notification.is_read)
      : notifications;

  return (
    <section className="notifications-page">
      <div className="notifications-heading">
        <div>
          <div className="notifications-eyebrow">
            <Bell size={15} />
            SCHOOL MANAGEMENT
          </div>

          <h1>Notifications</h1>

          <p className="notifications-subtitle">
            Keep track of important updates and school activities.
          </p>
        </div>

        <button
          type="button"
          className="notifications-refresh"
          onClick={() => loadNotifications(false)}
          disabled={loading || refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "notifications-spinning" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="notifications-summary">
        <div className="notifications-summary-icon">
          <Bell size={23} />
        </div>

        <div className="notifications-summary-copy">
          <span>Unread notifications</span>
          <strong>{unreadCount}</strong>
          <small>
            {unreadCount === 0
              ? "You're all caught up."
              : "Updates that still need your attention."}
          </small>
        </div>

        <div className="notifications-summary-status">
          <CircleCheck size={17} />
          Administrator
        </div>
      </div>

      <div className="notifications-toolbar">
        <div className="notifications-tabs" role="group" aria-label="Filter notifications">
          <button
            type="button"
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All
            <span>{notifications.length}</span>
          </button>

          <button
            type="button"
            className={filter === "unread" ? "active" : ""}
            onClick={() => setFilter("unread")}
          >
            Unread
            <span>{unreadCount}</span>
          </button>
        </div>

        <button
          type="button"
          className="notifications-mark-all"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || markingAll || loading}
        >
          {markingAll ? (
            <LoaderCircle size={16} className="notifications-spinning" />
          ) : (
            <CheckCheck size={17} />
          )}
          Mark all as read
        </button>
      </div>

      {error && (
        <div className="notifications-error" role="alert">
          <AlertCircle size={19} />
          <span>{error}</span>
          <button type="button" onClick={() => loadNotifications()}>
            Try again
          </button>
        </div>
      )}

      {actionError && (
        <div className="notifications-action-error" role="alert">
          <AlertCircle size={17} />
          {actionError}
          <button type="button" onClick={() => setActionError("")}>
            Dismiss
          </button>
        </div>
      )}

      <div className="notifications-list-heading">
        <div>
          <h2>Recent activity</h2>
          <p>Your latest notifications appear here.</p>
        </div>

        {!loading && !error && (
          <span className="notifications-total">
            {filteredNotifications.length}{" "}
            {filteredNotifications.length === 1 ? "notification" : "notifications"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="notifications-state">
          <LoaderCircle
            size={30}
            className="notifications-spinning"
          />
          <h3>Loading notifications</h3>
          <p>Please wait while we retrieve your updates.</p>
        </div>
      ) : !error && filteredNotifications.length === 0 ? (
        <div className="notifications-state">
          <div className="notifications-empty-icon">
            <Inbox size={32} />
          </div>

          <h3>
            {filter === "unread"
              ? "No unread notifications"
              : "No notifications yet"}
          </h3>

          <p>
            {filter === "unread"
              ? "You've read all your current notifications."
              : "School updates and reminders will appear here when available."}
          </p>

          {filter === "unread" && notifications.length > 0 && (
            <button
              type="button"
              className="notifications-view-all"
              onClick={() => setFilter("all")}
            >
              View all notifications
            </button>
          )}
        </div>
      ) : !error ? (
        <div className="notifications-list">
          {filteredNotifications.map((notification) => {
            const NotificationIcon = getNotificationIcon(
              notification.notification_type
            );

            const isBusy = busyId === notification.id;

            return (
              <article
                className={`notification-card ${
                  notification.is_read ? "is-read" : "is-unread"
                }`}
                key={notification.id}
              >
                <div className="notification-type-icon">
                  <NotificationIcon size={21} />
                </div>

                <div className="notification-content">
                  <div className="notification-title-row">
                    <h3>{notification.title}</h3>

                    {!notification.is_read && (
                      <span className="notification-unread-badge">
                        <span />
                        Unread
                      </span>
                    )}
                  </div>

                  <p className="notification-message">
                    {notification.message}
                  </p>

                  <div className="notification-metadata">
                    <span className="notification-type">
                      {(notification.notification_type || "General")
                        .replaceAll("_", " ")}
                    </span>

                    <span className="notification-date">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                </div>

                <div className="notification-actions">
                  {!notification.is_read && (
                    <button
                      type="button"
                      className="notification-action-button"
                      title="Mark as read"
                      aria-label={`Mark ${notification.title} as read`}
                      disabled={isBusy}
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      <Check size={18} />
                    </button>
                  )}

                  <button
                    type="button"
                    className="notification-action-button delete"
                    title="Delete notification"
                    aria-label={`Delete ${notification.title}`}
                    disabled={isBusy}
                    onClick={() => handleDelete(notification.id)}
                  >
                    {isBusy ? (
                      <LoaderCircle
                        size={17}
                        className="notifications-spinning"
                      />
                    ) : (
                      <Trash2 size={17} />
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      <div className="notifications-footer">
        <CheckCheck size={16} />
        <span>
          Notifications are private to your administrator account.
        </span>
      </div>
    </section>
  );
}

export default Notifications;
