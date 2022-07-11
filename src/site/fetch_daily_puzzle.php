<?php
header('Content-encoding: gzip');

$start = new DateTime("2022-03-05");
$start->setTimezone(new DateTimeZone('GMT'));
$today = new DateTime("now");
$today->setTimezone(new DateTimeZone('GMT'));

$path = "./daily-puzzles/";
$days = $today->diff($start)->days;
$file = sprintf("%05d.svg.gz", $days);
$data = file_get_contents($path.$file);
$uncompressed = gzdecode($data);

$data = sprintf("<!--daily: %05d-->\n", $days).$uncompressed;
echo gzencode($data);
?>
