<?php
header('Content-encoding: gzip');

$start = new DateTime("2022-03-05");
$start->setTimezone(new DateTimeZone('GMT'));
$today = new DateTime("now");
$today->setTimezone(new DateTimeZone('GMT'));

$path = "./daily-puzzles/";
$file = sprintf("%05d.svg.gz", $today->diff($start)->days);
$data = file_get_contents($path.$file);
$uncompressed = gzdecode($data);

$data = sprintf("<!--daily: %05d-->\n", $today->diff($start)->days).$uncompressed;
echo gzencode($data);
?>
